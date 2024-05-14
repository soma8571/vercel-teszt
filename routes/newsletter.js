const express = require('express')
const app = express()
const router = express.Router()
const bcrypt = require('bcrypt')
const connection = require('../src/db')
const jwt = require('jsonwebtoken')

module.exports = router

router.post("/save", (req, res) => {
    if (req.body?.subject) {
        const subject = req.body.subject
    } else {
        res.status(403).json({msg: "Hiba. Hiányzó adat: tárgy"})
        return
    }
    if (req.body?.mailBody) {
        const mailBody = req.body.mailBody
    } else {
        res.status(403).json({msg: "Hiba. Hiányzó adat: levél törzs"})
        return
    }
    if (req.body?.dateToSend) {
        const dateToSend = req.body.dateToSend
    } else {
        res.status(403).json({msg: "Hiba. Hiányzó adat: küldés dátuma"})
        return
    }
    console.log("megvan minden")
    res.send("minden ok")

    //Ha rendelkezésre áll minden szükséges adat a levéllel kapcsolatban, akkor:
    //1, címzettek meghatározása
        //1.a: első körben csak néhány meghatározott címre küldjük ki (tesztkörnyezet)
        const recipients = [ 505, 506]
    //2, az adatbázis newsletters táblájába mentjük a levelet 
    const insertQuery = "INSERT INTO newsletters (subject, newsletter_body, date_to_send, user_id) VALUES (?, ?, ?, ?)"
    const params = [req.body.subject, req.body.mailBody, req.body.dateToSend, ""]
    recipients.map(userId => {
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
        }
    })
    
})