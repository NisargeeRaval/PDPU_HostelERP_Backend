const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: process.env.NODE_MAILER_EMAIL_SERVICE,
    auth: {
        user: process.env.NODE_MAILER_USER_EMAIL,
        pass: process.env.NODE_MAILER_APP_PASSWORD,
    },
});

const sendEmail = (to, subject, text, html, callback) => {
    const mailOptions = {
        from: process.env.NODE_MAILER_USER_EMAIL,
        to,
        subject,
        text,
        html,
        contentType: 'text/html'
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            if (callback) {
                callback(error);
            }
        } else {
            console.log('Email sent:', info.response);
            if (callback) {
                callback(null, info);
            }
        }
    });
};

module.exports = sendEmail;