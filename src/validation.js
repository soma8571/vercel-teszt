const jwt = require('jsonwebtoken')
require('dotenv').config()

function isTokenValid(req, res, next) {
    if (req.headers['authorization']) {
        const token = req.headers['authorization']
            .slice(7, req.headers['authorization'].length)
        //ha megvan az auth header akkor még ellenőrizni is kell, hogy a token valid-e 
        try {
            const decoded = jwt.verify(token, process.env.JWT_KEY)
            next()
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                res.status(401).send("Hiba: a token lejárt. Bejelentkezés szükséges.");
            } else if (err.name === 'JsonWebTokenError') {
                res.status(401).send("Hiba a tokennel.");
            } else {
                res.status(401).send(`Hiba: ${err?.name} ${err?.message}`);
            }
        }
    } else {
        res.status(401).send("Hiba: hiányzó authorizációs adatok.")
    }
}

module.exports = isTokenValid