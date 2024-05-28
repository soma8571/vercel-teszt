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

//visszaadja a tömb paraméterben érkező azonosítókhoz tartozó hírlevelek adatait - VERSION 2
async function getNewsletterData_v2(ArrayOfNewsletterIds) {
    if (!ArrayOfNewsletterIds) {
        return false
    }
    //console.log(ArrayOfNewsletterIds)
    const query = "SELECT u.email, n.* FROM newsletters n INNER JOIN users u ON n.user_id = u.id_users WHERE id_newsletters IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    try {
        const result = await new Promise((resolve, reject)=>{
            connection.query(query, ArrayOfNewsletterIds, (err, res, fields)=> {
                if (err) {
                    console.log(err)
                    reject(`Hiba: ${err}`)
                }
                if (res?.length === 0) {
                    console.log("Hiba: a megadott azonosítójú hírlevél nem található.")
                    reject("Hiba: a megadott azonosítójú hírlevél nem található. ")
                }
                //console.log(res)
                resolve(res)
            })
        })
        return result
    } catch (err) {
        console.log(err)
        return err
    }
}

const sendingMail_v2 = async (ArrayOfNewsletterIds) => {
    const newsletterData = await getNewsletterData_v2(ArrayOfNewsletterIds)
    if (Array.isArray(newsletterData)) {
        try {
            const promiseArray = newsletterData.map(item => {
                return new Promise((resolve, reject) => {
                    let options = {
                        ...mailOptions,
                        to: item.email,
                        subject: item.subject,
                        text: item.newsletter_body
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
                        updateNewsletterStatusOnSuccess(item.id_newsletters)
                        resolve("Az email sikeresen elküldve.")
                        //resolve(info.messageId)
                    });

                })
            })

            Promise.allSettled(promiseArray).then(resArray => {
                const success = resArray.filter(item => item.status === 'fulfilled')
                console.log(`${success.length} db email elküldése sikeres volt`)
                return `${success.length} db email elküldése sikeres volt`
            })

        } catch(err) {
            console.log("Ismeretlen hiba.")
            return "Ismeretlen hiba"
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

module.exports = sendingMail_v2