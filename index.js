const express = require('express')
const app = express()
require('dotenv').config();
const connection = require('./src/db')
const sendingMail = require('./src/mailer')
const cors = require('cors')
const user = require('./routes/user')

const corsOptions = {
    origin: "http://localhost:3000",
    credentials: true,
}
app.use(cors(corsOptions))

const port = process.env.PORT ?? 8008;

// For parsing application/json
app.use(express.json());
 
// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use("/user", user)

app.get("/", (req, res, next)=> {
    //res.send(myData)
    res.send(process.env.DB_HOST ?? "nincs db host")
})

app.get("/mail", (req, res) => {
    sendingMail().then((eredmeny)=>{
        res.send("A küldés sikeres volt. " + eredmeny)
    })
    .catch(err => res.send("sikeretelen küldés. " + err))
})


app.listen(port, ()=> {
    console.log(`Server listening on ${port} port.`)
})

