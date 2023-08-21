const BaseController = require('./baseController');
const Forbidden = require('../errors/Forbidden');
const NotFound = require('../errors/NotFound');
const user_model = require('../models/userModel');
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

module.exports = class Basic extends BaseController {
    async base_url(req, res) {
        res.send('Welcome to PDEU_HostelERP base url');
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Find user by email
            const user = await user_model.findOne({ email });
            if (!user) {
                throw new Forbidden('User Does not Exists');
            }

            // Compare passwords
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new Forbidden('Invalid Password');
            }

            // Generate JWT
            const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET_KEY);

            return this.sendJSONResponse(
                res,
                "Login Succesfully",
                {
                    length: 1
                },
                token
            );
        } catch (error) {
            if (error instanceof NotFound) {
                console.log(error); // throw error;
            }
            return this.sendErrorResponse(req, res, error);
        }
    }

    async register(req, res) {
        try {
            const { email, password, firstname, lastname, rollno, mobileno, parentsmobile, address } = req.body;

            // Check if user already exists
            const existingUser = await user_model.findOne({ email });
            if (existingUser) {
                throw new Forbidden("User Already Exists");
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new user
            const user = new user_model({
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

            return this.sendJSONResponse(
                res,
                "User Register Succesfully",
                {
                    length: 1
                },
                user
            );
        } catch (error) {
            if (error instanceof NotFound) {
                console.log(error); // throw error;
            }
            return this.sendErrorResponse(req, res, error);
        }
    }
};