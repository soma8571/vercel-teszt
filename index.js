const express = require('express')
const app = express()
require('dotenv').config();

const port = process.env.PORT ?? 8008;

const myData = {
    name: "Teszt Elek",
    age: 33
}

app.get("/", (req, res, next)=> {
    res.send(myData)
});

app.listen(port, ()=> {
    console.log(`Server listening on ${port} port.`)
})

