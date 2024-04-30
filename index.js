const express = require('express')
const app = express()
require('dotenv').config();
const connection = require('./src/db')
const sendingMail = require('./src/mailer')

const port = process.env.PORT ?? 8008;

const myData = {
    name: "Teszt Elek",
    age: 33
}

// For parsing application/json
app.use(express.json());
 
// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res, next)=> {
    //res.send(myData)
    res.send(process.env.DB_HOST ?? "nincs db host")
})

app.get("/users", (req, res, next)=>{
    try {
        connection.query("SELECT * FROM users LIMIT 5", (error, results, fields)=>{
            if (error) throw error;
            //console.log(fields);
            res.send(results);
        })
    } catch (err) {
        res.send("Hiba a kérés során")
    }
})

app.get("/mail", (req, res) => {
    /* try {
        const sendingInfo = await sendingMail()
        res.send("A levél küldése sikeres volt." + sendingInfo)
    } catch (err) {
        res.status(403).send("Hiba történt a levél küldése során")
    } */
    sendingMail().then((eredmeny)=>{
        res.send("A küldés sikeres volt. " + eredmeny)
    })
    .catch(err => res.send("sikeretelen küldés. " + err))
})

app.listen(port, ()=> {
    console.log(`Server listening on ${port} port.`)
})

