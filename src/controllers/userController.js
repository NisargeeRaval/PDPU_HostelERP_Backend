const student_model = require('../models/studentModel');
const admin_model = require('../models/adminModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: process.env.NODE_MAILER_EMAIL_SERVICE, // Use your email service provider
    auth: {
        user: process.env.NODE_MAILER_USER_EMAIL,
        pass: process.env.NODE_MAILER_APP_PASSWORD,
    },
});

module.exports = class Basic {

    async load_login_page(req, res) {
        res.render('HTML/basic/login');
    }

    async login(req, res) {
        try {

            const { email, password } = req.body;

            // Find user by email
            const student = await student_model.findOne({ email });

            if (student) {
                // Compare passwords
                const isPasswordValid = await bcrypt.compare(password, student.password);
                if (!isPasswordValid) {
                    const headingMessage = "Error while login!";
                    const paragraphMessage = "Incorrect Password. Try to login with correct password or change password!";
                    const newRoute = '/user/login';
                    res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
                }

                // Generate JWT
                const token = jwt.sign({ studentId: student._id, role: student.role }, process.env.JWT_SECRET_KEY);

                res.render('HTML/student/studentHome', { token: token });
            }

            const admin = await admin_model.findOne({ email });
            if (admin) {
                // Compare passwords
                const isPasswordValid = await bcrypt.compare(password, admin.password);
                if (!isPasswordValid) {
                    const headingMessage = "Error while login!";
                    const paragraphMessage = "Incorrect Password. Try to login with correct password or change password!";
                    const newRoute = '/user/login';
                    res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
                }

                // Generate JWT
                const token = jwt.sign({ userId: admin._id, role: 'admin' }, process.env.JWT_SECRET_KEY);

                const userData = {
                    email: admin.email,
                    phone: admin.phone,
                    role: 'admin'
                }

                res.render('HTML/admin/adminHome', { token: token, userData: userData });
            }

            if (!student && !admin) {
                const headingMessage = "Error while login!";
                const paragraphMessage = "User does not exists. Try to Register!";
                const newRoute = '/user/register';
                res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }
        } catch (error) {
            const headingMessage = "Something went Wrong";
            const paragraphMessage = "Error while login. Try to login again!";
            const newRoute = '/user/login';
            res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_register_page(req, res) {
        res.render('HTML/basic/register');
    }

    async register(req, res) {
        try {
            const { email, password, firstname, lastname, rollno, mobileno, parentsmobile, address } = req.body;

            // Check if user already exists
            const existingUser = await student_model.findOne({ email });
            if (existingUser) {
                const headingMessage = "Error can not register!";
                const paragraphMessage = "User already exists. Try to login!";
                const newRoute = '/user/login';
                res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
                // throw new Forbidden("User Already Exists");
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new user
            const user = new student_model({
                email,
                password: hashedPassword,
                firstname,
                lastname,
                rollno,
                mobileno,
                parentsmobile,
                address
            });

            const mailOptions = {
                from: process.env.NODE_MAILER_USER_EMAIL,
                to: email,
                subject: 'Welcome to Stack-OverFlow-Clone',
                text: 'Thank you for registration with Stack-OverFlow-Clone',
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log('Error:', error);
                } else {
                    console.log('Email sent:', info.response);
                }
            });

            await user.save();

            const headingMessage = "Succesfully registered!";
            const paragraphMessage = "Wait for admin approval!";
            const newRoute = '/user/login';
            res.render('utilities/responseMessageSuccess.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        } catch (error) {
            console.log(error);
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while registering. Try to register again!";
            const newRoute = '/user/register';
            res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }
};