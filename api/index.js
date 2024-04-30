const express = require('express')
const app = express()
require('dotenv').config();
const connection = require('../src/db')

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
    /* try {
        connection.query("SELECT * FROM users LIMIT 5", (error, results, fields)=>{
            if (error) throw error;
            //console.log(fields);
            res.send(results);
        })
    } catch (err) {
        res.send("Hiba a kérés során")
    } */
    res.send(process.env.DB_HOST ?? "nincs db host")
})

app.listen(port, ()=> {
    console.log(`Server listening on ${port} port.`)
})

