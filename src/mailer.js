const nodemailer = require('nodemailer');
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
    to: 'tamas.somloi@gmail.com',
    subject: 'Test Email from Node.js',
    text: 'This is a test email sent from a Node.js app!'
};


const sendingMail = () => {
    /* transporter.verify(function (error, success) {
        if (error) {
          console.log(error);
        } else {
          console.log("Server is ready to take our messages");
        }
      }); */
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

module.exports = sendingMail