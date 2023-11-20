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

const sendEmailToMultipleUsers = (recipients, subject, text, html, attachments, callback) => {
    if (!Array.isArray(recipients)) {
        recipients = [recipients]; // Ensure recipients is an array
    }

    const mailOptions = {
        from: process.env.NODE_MAILER_USER_EMAIL,
        to: recipients.join(', '), // Join multiple email addresses with commas
        subject,
        text,
        html,
        attachments, // Attachments should be an array of attachment objects
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

const sendEmailWithCC = (to, subject, text, html, cc, callback) => {
    const mailOptions = {
        from: process.env.NODE_MAILER_USER_EMAIL,
        to: to, // Email address of the primary recipient
        subject,
        text,
        html,
        cc: cc, // Email address for CC
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



module.exports = { sendEmail, sendEmailToMultipleUsers, sendEmailWithCC };