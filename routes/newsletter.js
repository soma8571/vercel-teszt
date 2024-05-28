const express = require('express')
const app = express()
const router = express.Router()
const bcrypt = require('bcrypt')
const connection = require('../src/db')
const sendingMail = require('../src/mailer')
const sendingMail_v2 = require('../src/mailer_v2')
const jwt = require('jsonwebtoken')

module.exports = router

router.post("/save", async (req, res) => {
    if (!req.body?.subject) {
        res.status(403).json({msg: "Hiba. Hiányzó adat: tárgy"})
        return
    }
    if (!req.body?.mailBody) {
        res.status(403).json({msg: "Hiba. Hiányzó adat: levél törzs"})
        return
    }
    if (!req.body?.dateToSend) {
        res.status(403).json({msg: "Hiba. Hiányzó adat: küldés dátuma"})
        return
    }

    //Ha rendelkezésre áll minden szükséges adat a levéllel kapcsolatban, akkor:
    //1, címzettek meghatározása
    //1.a: első körben csak néhány meghatározott címre küldjük ki (tesztkörnyezet)
    //const recipients = [ 505, 506]
    const recipients = []
    for (let i=0; i < 40; i++) {
        if (i % 2 === 0)
            recipients.push(506)
        else
            recipients.push(505)
    }

    //1.b: éles beállítás: az összes felhasználó lekérése
    /*
    const userIds = await getAllUserIdFromDB()
    const recipients = Array.isArray(userIds) ? userIds : []
    */
    console.log(recipients)

    //2, az adatbázis newsletters táblájába mentjük a levelet 
    const insertQuery = "INSERT INTO newsletters (subject, newsletter_body, date_to_send, user_id) VALUES (?, ?, ?, ?)"
    const params = [req.body.subject, req.body.mailBody, req.body.dateToSend, ""]
    recipients.map(item => {
        //a params tömb utolsó elemét mindig cseréljük ki az aktuális userId-re
        let userId = item?.id_users ?? item;
        console.log(userId)
        params.splice(-1, 1, userId)
        try {
            const result = new Promise((resolve, reject) => {
                connection.query(insertQuery, params, (err, res, fields)=>{
                    if (err) {
                        console.log("Hiba a rögzítés során. " + err.message);
                        reject(false)
                    }
                    resolve(true)
                })
            })  
            if (result) {
                console.log("sikeres mentés")
            } else {
                console.log("sikertelen mentés")
            }
        } catch (err) {
            console.log(err)
            //res.status(403).json({error: "Hiba a mentés során."})
        }
    })
    res.status(200).json({msg: "A hírlevél adatainak rögzítése befejeződött."})
})

async function getAllUserIdFromDB() {
    const query = "SELECT id_users FROM users"
    const dbQuery = await new Promise((resolve, reject)=>{
        connection.query(query, (err, res, fields)=>{
            if (err) {
                console.log("Hiba a címzettek lekérése során")
                reject(false)
            } else {
                //console.log(res)
                resolve(res)
            }
        })
    })
    return dbQuery
}

//Válaszul egy objektumlistát ad, melyben a kiküldésre váró (unsent, pending) levelek adatai találhatóak
router.get("/getunsentdata", async (req, res)=> {
    const query = "SELECT email, id_newsletters, subject, status FROM newsletters n INNER JOIN users u ON n.user_id = u.id_users WHERE (status = 'UNSENT' OR status = 'PENDING') AND attempt_to_send < 3 ORDER BY id_newsletters ASC";
    const dbQuery = await new Promise((resolve, reject)=>{
        connection.query(query, (err, res, fields)=>{
            if (err) {
                console.log("Hiba az adatok lekérése során")
                reject(false)
            } else {
                //console.log(res)
                resolve(res)
            }
        })
    })
    if (dbQuery) {
        res.status(200).json(dbQuery)
    } else {
        res.status(403).json({msg: "Hiba az adatok lekérése során."})
    }
    
})

//A kiküldésre váró levelek számával válaszol
router.get("/getnumberoftobesent", async (req, res) => {
    const query = "SELECT COUNT(*) as toBeSent FROM newsletters WHERE (status = 'PENDING' OR status = 'UNSENT') AND attempt_to_send < 3 AND date_to_send <= NOW()"
    const promise = await new Promise((resolve, reject) => {
        connection.query(query, (err, result, fields)=>{
            if (err) {
                console.log(err)
                reject(false)
            }
            console.log(result)
            resolve(result[0].toBeSent)   
        })
    })
    //console.log(promise)
    if (promise) {
        res.status(200).json({msg: `Jelenleg ${promise} db levél vár kiküldésre.`})
        return
    }
    res.status(403).json({msg: "Hiba az adatok lekérése során"})
})

//A kapott objektumtömbben érkező azonosítójú hírlevelek kiküldése
router.post("/send", async (req, res)=> {
    if (req.body?.data) {
        //reg.body.data: egy 10 elemű objektumtömb, egy objektum {id: xxx}
        const newsletterIDs = [...req.body.data]
        const promiseArray = newsletterIDs.map(item => {
            return new Promise(async (resolve, reject)=>{
                const eredmeny = await sendingMail(item.id)
                if (eredmeny !== false) {
                    resolve(true)
                } else {
                    reject(false)
                }
            })
        })
        Promise.allSettled(promiseArray).then(resultArray => {
            const successSendings = resultArray.filter(item => item.status === "fulfilled")
            console.log(`Sikeresen kiküldve: ${successSendings.length} db email`)
            res.status(200).json({msg: `Sikeresen kiküldve: ${successSendings.length} db email`})
        })
        
        
    } else {
        res.status(403).json({msg: "Hiba."})
    }
})

//A kapott objektumtömbben érkező azonosítójú hírlevelek kiküldése - VERSION 2
router.post("/send-v2", async (req, res)=> {
    if (req.body?.data) {
        //reg.body.data: egy 10 elemű objektumtömb, egy objektum {id: xxx}
        const newsletterIDs = [...req.body.data]
        const arrayOfIds = newsletterIDs.map(item => item.id)
        const resOfSending = await sendingMail_v2(arrayOfIds)
        
        if (Array.isArray(resOfSending)) {
            res.status(200).json({msg: resOfSending})
        } else {
            res.status(403).json({msg: resOfSending})
        }
        
    } else {
        res.status(403).json({msg: "Hiba."})
    }
})

router.post("/mailtest", async (req, res) => {
    if (req.body?.newsletterId) {
        sendingMail(req.body.newsletterId).then(eredmeny => {
            res.send(eredmeny)
        }).catch(err => res.send("Hiba: " + err))
        return
    }
    res.status(403).json({msg: "Hiba. Hiányzó hírlevél azonosító."})
    
})