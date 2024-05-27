const nodemailer = require('nodemailer');
const connection = require('./db');
require('dotenv').config();

let transporter = nodemailer.createTransport({
    host: 'mail.nethely.hu',
    //VVKH esetén: 25, otthoni gépről nem megy a küldés, vercel: 1025-ös port
    port: 1025,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

let mailOptions = {
    from: 'support@hrcpayouts.com',
    to: '',
    subject: '',
    text: ''
};

//visszaadja a paraméterben kapott azonosítójú hírlevél adatait
async function getNewsletterData(newsletterId) {
    if (!newsletterId) {
        return false
    }
    console.log(newsletterId)
    const query = "SELECT u.email, n.* FROM newsletters n INNER JOIN users u ON n.user_id = u.id_users WHERE id_newsletters = ?"
    try {
        const result = await new Promise((resolve, reject)=>{
            connection.query(query, newsletterId, (err, res, fields)=> {
                if (err) {
                    console.log(err)
                    reject(`Hiba: ${err}`)
                }
                if (res?.length === 0) {
                    console.log("Hiba: a megadott azonosítójú hírlevél nem található.")
                    reject("Hiba: a megadott azonosítójú hírlevél nem található. ")
                }
                console.log(res)
                resolve(res)
            })
        })
        return result
    } catch (err) {
        console.log(err)
        return err
    }
}

/* const simpleMailTest = async () => {
    let options = {
        from: "support@hrcpayouts.com", 
        to: "tamas.somloi@gmail.com", 
        subject: "Teszt 05.25.", 
        text: "Hello! This is the message"
    }
    let sending = await new Promise((resolve, reject) => {
        try {
            transporter.sendMail(options, function(error, info){
                if (error) {
                    console.log(error);
                    reject(false)
                } else {
                    console.log('Email sent: ' + info.response);
                    resolve(true)
                }
            });
        } catch(err) {
            console.log(err)
            reject(false)
        }
    })
    return sending
} */

const sendingMail = async (newsletterId) => {
    const newsletterData = await getNewsletterData(newsletterId)
    if (Array.isArray(newsletterData)) {
        try {
            const promise = await new Promise((resolve, reject)=> {
                let options = {
                    ...mailOptions, 
                    to: newsletterData[0].email, 
                    subject: newsletterData[0].subject, 
                    text: newsletterData[0].newsletter_body
                }
                transporter.sendMail(options, function(error, info) {
                    if (error) {
                        console.log(error);
                        updateNewsletterStatusOnFailure(item.id_newsletters)
                        //reject(error.message)
                        reject("Hiba az email küldése során.")
                    }
                    console.log('Email sent: ' + info.response);
                    //ha a levél elküldésre került, akkor az adatbázisban módosítani kell az adott levél státuszát 'SENT' értékre 
                    resolve("Az email sikeresen elküldve.")
                    updateNewsletterStatusOnSuccess(item.id_newsletters)
                    //resolve(info.messageId)
                });
            })
            return promise
        } catch(err) {
            console.log("Ismeretlen hiba.")
            return "Ismeretlen hiba."
        }
    } else {
        //ha nem egy tömb, amiben az email adatai vannak, akkor egy hibaüzenet
        return newsletterData
    }
}

function updateNewsletterStatusOnFailure(newsletterId) {
    const updateQuery = "UPDATE newsletters SET status = 'UNSENT', attempt_to_send = attempt_to_send + 1 WHERE id_newsletters = ?"
    connection.query(updateQuery, [newsletterId], (err, res, fields)=> {
        if (err) {
            console.log("Hiba az elküldött levél státuszának módosítása során. " + newsletterId)
        }
    })
}

function updateNewsletterStatusOnSuccess(newsletterId) {
    const updateQuery = "UPDATE newsletters SET status = 'SENT', sended_at = NOW() WHERE id_newsletters = ?"
    connection.query(updateQuery, [newsletterId], (err, res, fields)=> {
        if (err) {
            console.log("Hiba az elküldött levél státuszának módosítása során. " + newsletterId)
        }
    })
}

module.exports = sendingMail