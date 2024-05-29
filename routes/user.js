const express = require('express')
const app = express()
const router = express.Router()
const bcrypt = require('bcrypt')
const connection = require('../src/db')
const jwt = require('jsonwebtoken')
require('dotenv').config()

router.post("/hash", (req, res)=>{
    if (req.body?.plaintext) {
        const hash = bcrypt.hash(req.body.plaintext, 10)
            .then(hash => res.send({hash}))
        
    } else {    
        res.send("Error. Missing data.")
    }
})

router.post("/login", (req, res, next) => {

    const passwdPosted = req.body?.password ?? ""
    const emailPosted = req.body?.username ?? "" 
    if (passwdPosted !== "" && emailPosted !== "") {
        getUserAuthData(emailPosted).then(passDB => {
            if (passDB === false) {
                res.status(403).json({msg: "Hiba. Hibás email/jelszó páros." })

            } else {
                //res.send("pass: " + passDB)
                bcrypt.compare(passwdPosted, passDB).then(eredmeny => {
                    if (eredmeny) {
                        const token = jwt.sign({foo: 'bar'}, process.env.JWT_KEY, {expiresIn: "1h"})
                        res.json({"accessToken": token})
                    } else {
                        res.status(403).json({msg: "Hiba. Hibás email/jelszó páros." })
                    }
                })
            }
        })
    } else {
        res.status(403).send("Hiba. Hiányzó adatok.");
    }
    
})

async function getUserAuthData(email) {
    const query = "SELECT password FROM auth WHERE username = ?";
    try {
        const result = await new Promise((resolve, reject) => {
            connection.query(query, [email], (err, res, fields)=>{
                if (err) {
                    console.log("Hiba a lekérdezés során. " + err.message);
                    reject(false)
                } else {
                    //console.log(res)
                    if (res.length > 0)
                        resolve(res[0].password)
                    else
                        resolve(false)
                }
            })
        })
        return result
    } catch (err) {
        console.log(err)
        return false
    }
}

module.exports = router