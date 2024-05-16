const nodemailer = require('nodemailer');
const connection = require('./db');
require('dotenv').config();

let transporter = nodemailer.createTransport({
    host: 'mail.nethely.hu', // Use your email provider
    port: 465,
    secure: true,
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

async function getNewsletterData() {
    //kiolvasunk 5 küldetlen levelet a newsletter táblából
    const query = "SELECT u.email, n.* FROM newsletters n INNER JOIN users u ON n.user_id = u.id_users WHERE status = 'PENDING' LIMIT 5"
    try {
        const result = await new Promise((resolve, reject)=>{
            connection.query(query, (err, res, fields)=> {
                if (err) {
                    console.log(err)
                    reject(false)
                }
                if (res?.length > 0) {
                    res.map(item => {
                        //console.log(item)
                    })
                    resolve(res)
                }
                reject(false)
            })
        })
        return result
    } catch (err) {
        console.log("Hiba")
        return false
    }
    
    
    
}

const sendingMail = async () => {
    /* transporter.verify(function (error, success) {
        if (error) {
          console.log(error);
        } else {
          console.log("Server is ready to take our messages");
        }
      }); */
      const newsletterData = await getNewsletterData()
      if (newsletterData === false) 
        console.log("nincs adat")
      else {
        //console.log("van adat")
        //console.log(newsletterData)
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
                        reject(error.message)
                    } else {
                        console.log('Email sent: ' + info.response);
                        resolve(info.messageId)
                    }
                });
            })
            
        })
        Promise.allSettled(promiseArray).then(resArray => 
            resArray.map(item => console.log(item.status))
        )
      }
    
}

module.exports = sendingMail