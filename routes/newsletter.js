const express = require('express')
const app = express()
const router = express.Router()
const bcrypt = require('bcrypt')
const connection = require('../src/db')
const jwt = require('jsonwebtoken')
const { get } = require('./user')

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

    //1.b: éles beállítás: az összes felhasználó lekérése
    const userIds = await getAllUserIdFromDB()
    const recipients = Array.isArray(userIds) ? userIds : []

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