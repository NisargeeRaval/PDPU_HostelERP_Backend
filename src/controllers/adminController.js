const admin_model = require('../models/adminModel');
const student_model = require('../models/studentModel');
const hostel_model = require('../models/hostelModel');
const update_path = require('../utilities/response_image_url');
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
        res.render('HTML/admin/adminHome.ejs', { userData: null });
    }

    async load_warden_page(req, res) {
        try {
            const hostel = await hostel_model.find({}).select('_id hostelName');
            res.render('HTML/admin/addWarden.ejs', { hostel: hostel });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while loading page. Reload the page again!";
            const newRoute = '/admin/dashboard';
            res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_verify_student_page(req, res) {
        try {
            const student = await student_model.find({ status: 'false' }, { password: 0 });

            for (let i = 0; i < student.length; i++) {
                for (let j = 0; j < student[i].proof.length; j++) {
                    student[i].proof[j] = await update_path("student", student[i].proof[j]);
                }
            }

            res.render('HTML/admin/verifyStudent.ejs', { student: student });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while fetching data. Reload the page again!";
            const newRoute = '/admin/dashboard';
            res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async verify_student(req, res) {
        try {
            const { studentId, status } = req.body;

            await student_model.findByIdAndUpdate(studentId, { status: status });

            return res.status(200).JSON({ data: 'ok' });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while updating student status. Reload update again!";
            const newRoute = '/admin/verifyStudent';
            res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }
};