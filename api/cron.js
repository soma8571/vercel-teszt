const sendingMail = require('../src/mailer')

export function cronTest() {
    sendingMail()
}