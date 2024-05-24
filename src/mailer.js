const nodemailer = require('nodemailer');
const connection = require('./db');
require('dotenv').config();

let transporter = nodemailer.createTransport({
    host: 'mail.nethely.hu',
    port: 25, //VVKH network esetén: 25, egyébként 465 és secure: true
    secure: false, //VVKH esetén: false, egyébként true
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    },
    requireTLS: true
});

let mailOptions = {
    from: 'support@hrcpayouts.com',
    to: '',
    subject: '',
    text: ''
};

async function getNewsletterData(newsletterId = undefined) {
    let query
    if (!newsletterId) {
        //kiolvasunk 5 küldetlen levelet a newsletter táblából
        query = "SELECT u.email, n.* FROM newsletters n INNER JOIN users u ON n.user_id = u.id_users WHERE status = 'PENDING' AND attempt_to_send < 3 AND date_to_send <= NOW() LIMIT 5"
    } else {
        query = "SELECT u.email, n.* FROM newsletters n INNER JOIN users u ON n.user_id = u.id_users WHERE id_newsletters = ?"
    }
    const param = newsletterId ? [newsletterId] : []
    try {
        const result = await new Promise((resolve, reject)=>{
            connection.query(query, param, (err, res, fields)=> {
                if (err) {
                    console.log(err)
                    reject(false)
                }
                if (res?.length > 0) {
                    console.log(`Jelenleg ${res.length} kiküldésre váró levél van.`)
                    resolve(res)
                } else {
                    console.log("Jelenleg nincs kiküldésre váró levél az adatbázisban.")
                    reject(false)
                }
            })
        })
        return result
    } catch (err) {
        console.log("Hiba a kiküldésre váró levelek adatbázis lekérése során. " + err.message)
        return false
    }
}

const sendingMail = async (newsletterId) => {
    /* console.log(process.env.MAIL_USER)
    transporter.verify(function (error, success) {
        if (error) {
          console.log(error);
        } else {
          console.log("Server is ready to take our messages");
        }
      });  */
   
    /* const newsletterData = await getNewsletterData(newsletterId)
    if (newsletterData !== false) {
        const promiseArray = newsletterData.map((item, ind) => {
            return new Promise((resolve, reject)=> {
                let options = {
                    ...mailOptions, 
                    to: item.email, 
                    subject: item.subject, 
                    text: item.newsletter_body
                }
                transporter.sendMail(options, function(error, info){
                    if (error) {
                        console.log(error);
                        updateNewsletterStatusOnFailure(item.id_newsletters)
                        reject(error.message)
                    } else {
                        console.log('Email sent: ' + info.response);
                        //ha a levél elküldésre került, akkor az adatbázisban módosítani kell az adott levél státuszát 'SENT' értékre 
                        updateNewsletterStatusOnSuccess(item.id_newsletters)
                        resolve(info.messageId)
                    }
                });
            })
            
        })
        Promise.allSettled(promiseArray).then(resArray => 
            resArray.map(item => console.log(item.status)))
    } */
    const newsletterData = await getNewsletterData(newsletterId)
    if (newsletterData !== false) {
        try {
            const promise = await new Promise((resolve, reject)=> {
                let options = {
                    ...mailOptions, 
                    to: newsletterData[0].email, 
                    subject: newsletterData[0].subject, 
                    text: newsletterData[0].newsletter_body
                }
                transporter.sendMail(options, function(error, info){
                    if (error) {
                        console.log(error);
                        //updateNewsletterStatusOnFailure(item.id_newsletters)
                        //reject(error.message)
                        reject(false)
                    } else {
                        console.log('Email sent: ' + info.response);
                        //ha a levél elküldésre került, akkor az adatbázisban módosítani kell az adott levél státuszát 'SENT' értékre 
                        resolve(true)
                        //updateNewsletterStatusOnSuccess(item.id_newsletters)
                        //resolve(info.messageId)
                    }
                });
            })
            return promise
        } catch(err) {
            console.log("hiba")
            return false
        }
        
        
    } else {
        return false
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