const express = require('express')
const app = express()
require('dotenv').config();
const connection = require('./src/db')
const sendingMail = require('./src/mailer')
const cors = require('cors')
const user = require('./routes/user')
const newsletter = require('./routes/newsletter')
const isTokenValid = require('./src/validation')
//var cron = require('node-cron')

/*
cron.schedule('* * * * *', ()=> {
    console.log("Runs in every minutes. " + Date())
    sendingMail()
})
*/

const corsOptions = {
    origin: ["http://localhost:3000", "https://szeleste.hrcpayouts.com"],
    credentials: true,
}
app.use(cors(corsOptions))

const port = process.env.PORT ?? 8008;

// For parsing application/json
app.use(express.json());
 
// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use("/user", user)
app.use("/newsletter", newsletter)

app.get("/", (req, res, next)=> {
    //res.send(myData)
    res.send(process.env.DB_HOST ?? "nincs db host")
})

app.get("/numberofrecipients", isTokenValid, (req, res) => {
    const query = "SELECT COUNT(email) AS NumberOfRecipients FROM users"
    const promise = new Promise((resolve, reject) => {
        connection.query(query, (err, result, fields)=>{
            if (err) {
                console.log(err)
                reject("Hiba a lekérdezés során.")
            }
            //console.log(result)
            resolve(result[0].NumberOfRecipients)   
        })
    })
    promise.then(
        result => 
            res.status(200).json({msg: result})
        ,
        error => 
            res.status(403).json({msg: error})
    )
})

app.listen(port, ()=> {
    console.log(`Server listening on ${port} port.`)
})

