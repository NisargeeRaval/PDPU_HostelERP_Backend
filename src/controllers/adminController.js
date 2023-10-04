const admin_model = require('../models/adminModel');
const bcrypt = require('bcrypt');

module.exports = class Admin {
    async register(req, res) {
        try {
            const { email, password, phone } = req.body;

            // Check if user already exists
            const existingUser = await admin_model.findOne({ email });

            if (existingUser) {
                const headingMessage = "Error can not register!";
                const paragraphMessage = "Admin already exists. Try to login!";
                const newRoute = '/user/login';
                res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new user
            const admin = new admin_model({
                email,
                password: hashedPassword,
                phone
            });

            await admin.save();

            const headingMessage = "Succesfully registered!";
            const paragraphMessage = "Try to login!";
            const newRoute = '/user/login';
            res.render('utilities/responseMessageSuccess.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while registering. Try to register again!";
            const newRoute = '/admin/register';
            res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_dashboard_page(req, res) {
        res.render('HTML/admin/adminHome.ejs');
    }

    async load_warden_page(req, res) {
        res.render('HTML/admin/addWarden.ejs');
    }
};