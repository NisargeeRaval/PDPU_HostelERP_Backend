const admin_model = require('../models/adminModel');
const student_model = require('../models/studentModel');
const parents_model = require('../models/parentsModel');
const hostel_model = require('../models/hostelModel');
const room_model = require('../models/roomModel');
const update_path = require('../utilities/response_image_url');
const { sendEmail } = require('../services/sendEmailService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passwordGenerator = require('../utilities/random_password_generator');
require('dotenv').config();

module.exports = class Admin {
    async register(req, res) {
        try {
            const { email, password, phone, name } = req.body;

            // Check if user already exists
            const existingUser = await admin_model.findOne({ email });

            if (existingUser) {
                const headingMessage = "Error can not register!";
                const paragraphMessage = "Admin already exists. Try to login!";
                const newRoute = '/user/login';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new user
            const admin = new admin_model({
                email,
                password: hashedPassword,
                phone,
                name,
                photo: req.file.filename
            });

            await admin.save();

            const headingMessage = "Succesfully registered!";
            const paragraphMessage = "Try to login!";
            const newRoute = '/user/login';
            return res.render('utilities/responseMessageSuccess.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while registering. Try to register again!";
            const newRoute = '/admin/register';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_dashboard_page(req, res) {
        try {
            return res.render('HTML/admin/adminHome.ejs');
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while fetching data. Reload the page again!";
            const newRoute = '/user/login';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_warden_page(req, res) {
        try {
            const hostel = await hostel_model.find({}).select('_id hostelName');
            return res.render('HTML/admin/addWarden.ejs', { hostel: hostel });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while loading page. Reload the page again!";
            const newRoute = '/admin/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_verify_student_page(req, res) {
        try {
            const student = await student_model.find({ status: 'false' }, { password: 0 });

            for (let i = 0; i < student.length; i++) {
                for (let j = 0; j < student[i].proof.length; j++) {
                    student[i].proof[j] = await update_path("student", student[i].proof[j]);
                }

                student[i].proof.push(await update_path("student", student[i].profile));
            }

            return res.render('HTML/admin/verifyStudent.ejs', { student: student });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while fetching data. Reload the page again!";
            const newRoute = '/admin/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async verify_student(req, res) {
        try {
            const { studentId, status, reason } = req.body;

            const user = await student_model.findById(studentId).select('-password');

            if (!user) {
                const headingMessage = "Something went wrong";
                const paragraphMessage = "Error while updating student status. Student data not found!";
                const newRoute = '/admin/dashboard';
                res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            if (status == 'block') {
                const token = await jwt.sign({ user }, process.env.JWT_SECRET_KEY);
                const userDataUpdateLink = `${process.env.SERVER_URL}/admin/userUpdateDetails?token=${token}`

                const subject = 'PDPU Hostel ERP System - Registration Rejection Notification';

                const htmlContent = `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Registration Rejection Notification</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f2f2f2;
                            padding: 20px;
                        }
                        .container {
                            background-color: #fff;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            border-radius: 5px;
                        }
                        .header {
                            background-color: #ff0000;
                            color: #fff;
                            padding: 10px;
                            text-align: center;
                        }
                        .content {
                            padding: 20px;
                        }
                        .button {
                            display: inline-block;
                            background-color: #007BFF;
                            color: #000; /* Set the text color to black */
                            padding: 10px 20px;
                            text-decoration: none;
                            border-radius: 5px;
                        }
                        
                        .button:visited {
                            color: #000; 
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Registration Rejection Notification</h1>
                        </div>
                        <div class="content">
                            <p>Dear ${user.firstname + " " + user.lastname},</p>
                            <p>We regret to inform you that your registration for the PDPU Hostel ERP System has been rejected due to a predefined issue.</p>
                            <p><b>${reason}</b></p>
                            <p>However, we are here to help you. To proceed, please update your registration details by clicking the link below:</p>
                            <p><a class="button" href="${userDataUpdateLink}">Update Details</a></p>
                            <p>Please note that this link is intended for your use only. Do not share it with anyone else. Timely updating your details will expedite the registration process.</p>
                            <p>If you have any questions or need assistance, please don't hesitate to contact our support team at ${process.env.ADMIN_EMAIL}. We're here to assist you.</p>
                            <p>Thank you for considering the PDPU Hostel ERP System. We look forward to helping you complete your registration successfully.</p>
                            <p>Best regards,</p>
                            <p><b>${process.env.ADMIN_NAME}</b><br>ADMIN<br>PDPU Hostel ERP System</p>
                        </div>
                    </div>
                </body>
                </html>
                `;

                sendEmail(user.email, subject, '', htmlContent, (error, info) => {
                    if (error) {
                        res.status(500).json({ error: 'An error occurred while sending the email' });
                    } else {
                        res.status(200).json({ message: 'Notification of registration rejection sent. Check your email for details.' });
                    }
                });

                user.status = status
                await user.save();
            }

            if (status == 'true') {
                const subject = 'PDPU Hostel ERP System - Your Account Has Been Approved';

                const htmlContent = `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Your PDPU Hostel ERP Account is Approved</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f2f2f2;
                            padding: 20px;
                        }
                        .container {
                            background-color: #fff;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            border-radius: 5px;
                        }
                        .header {
                            background-color: #007BFF;
                            color: #fff;
                            padding: 10px;
                            text-align: center;
                        }
                        .content {
                            padding: 20px;
                        }
                        .button {
                            display: inline-block;
                            background-color: #007BFF;
                            color: #fff;
                            padding: 10px 20px;
                            text-decoration: none;
                            border-radius: 5px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Your PDPU Hostel ERP Account is Approved</h1>
                        </div>
                        <div class="content">
                            <p>Dear ${user.firstname + " " + user.lastname},</p>
                            <p>We are excited to inform you that your PDPU Hostel ERP account has been approved by our administrators. You now have full access to our Hostel ERP System!</p>
                            <p><b>You can use your registered email [${user.email}], mobile number [${user.mobileno}] or roll number [${user.rollno}] and password to log in and start using our services immediately.</b> Here's a quick overview of what you can do with your Hostel ERP account:</p>
                            <ul>
                                <li>Convenient Room Booking: Effortlessly book and manage your hostel room.</li>
                                <li>Quick Complaint Resolution: Report and track any issues, and we'll address them promptly.</li>
                                <li>Stay Informed: Receive important announcements and updates from the hostel administration.</li>
                            </ul>
                            <p>If you have any questions or need assistance while using our system, please feel free to contact our support team at ${process.env.ADMIN_EMAIL}. We're here to help you make the most of your hostel experience.</p>
                            <p>Thank you for choosing the PDPU Hostel ERP System. We look forward to making your hostel life more organized and hassle-free.</p>
                            <p>Best regards,</p>
                            <p><b>${process.env.ADMIN_NAME}</b><br>ADMIN<br>PDPU Hostel ERP System</p>
                        </div>
                    </div>
                </body>
                </html>
                `;

                const existingUser = await parents_model.findOne({
                    $or: [
                        { email: user.parentsemail },
                        { mobileno: user.parentsmobile }
                    ]
                });

                if (existingUser) {
                    const headingMessage = "Error can not register!";
                    const paragraphMessage = "Parents already exists!";
                    const newRoute = '/admin/dashboard';
                    return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
                }

                const parentPassword = await passwordGenerator(15);

                // Hash the password
                const hashedPassword = await bcrypt.hash(parentPassword, 10);

                // Create new user
                const parents = new parents_model({
                    email: user.parentsemail,
                    password: hashedPassword,
                    mobileno: user.parentsmobile,
                    name: user.parentsname
                });

                const result = await parents.save();

                user.parentsid = result._id;
                user.status = status

                await user.save();

                const parentsSubject = 'PDPU Hostel ERP System - Parent Account Credentials';

                const parentshtmlContent = `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Parent Account Credentials</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f2f2f2;
                            padding: 20px;
                        }
                        .container {
                            background-color: #fff;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            border-radius: 5px;
                        }
                        .header {
                            background-color: #007BFF;
                            color: #fff;
                            padding: 10px;
                            text-align: center;
                        }
                        .content {
                            padding: 20px;
                        }
                        .button {
                            display: inline-block;
                            background-color: #007BFF;
                            color: #fff;
                            padding: 10px 20px;
                            text-decoration: none;
                            border-radius: 5px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Your PDPU Hostel ERP Parent Account Credentials</h1>
                        </div>
                        <div class="content">
                            <p>Dear ${user.parentsname},</p>
                            <p>We are pleased to provide you with the login credentials for your Parent account of your child ${user.firstname + " " + user.lastname} in the PDPU Hostel ERP System.</p>
                            <p><b>Your login details:</b></p>
                            <ul>
                                <li>Username (Parent's Email): ${user.parentsemail} or(Parent's Mobile Number) ${user.parentsmobile}</li>
                                <li>Password: ${parentPassword}</li>
                            </ul>
                            <p>We recommend that you change your password after the first login to enhance the security of your account.</p>
                            <p>Please be advised that this email contains login credentials, so ensure it is kept confidential. If you have any questions or need assistance, please feel free to contact our support team at ${process.env.ADMIN_EMAIL}. We're here to assist you in making the most of your experience with the PDPU Hostel ERP System.</p>
                            <p>Thank you for choosing the PDPU Hostel ERP System. We look forward to serving you and improving your hostel experience.</p>
                            <p>Best regards,</p>
                            <p><b>${process.env.ADMIN_NAME}</b><br>ADMIN<br>PDPU Hostel ERP System</p>
                        </div>
                    </div>
                </body>
                </html>
                `;

                if (result) {
                    sendEmail(user.email, subject, '', htmlContent, (error, info) => {
                        if (error) {
                            res.status(500).json({ error: 'An error occurred while sending the email' });
                        } else {
                            res.status(200).json({ message: 'Your account has been approved. Check your email for details.' });
                        }
                    });

                    sendEmail(parents.email, parentsSubject, '', parentshtmlContent, (error, info) => {
                        if (error) {
                            res.status(500).json({ error: 'An error occurred while sending the email' });
                        } else {
                            res.status(200).json({ message: 'Your account has been approved. Check your email for details.' });
                        }
                    });
                }
            }

            return res.status(200).JSON({ data: 'ok' });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while updating student status. Reload update again!";
            const newRoute = '/admin/verifyStudent';
            res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_view_student_page(req, res) {
        try {
            return res.render('HTML/admin/viewStudent.ejs');
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while fetching data. Reload the page again!";
            const newRoute = '/admin/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async search_student(req, res) {
        try {
            const searchData = req.query.searchData;
            const students = await student_model.find({
                $or: [
                    { email: { $regex: searchData, $options: 'i' } }, // Case-insensitive email search
                    { firstname: { $regex: searchData, $options: 'i' } }, // Case-insensitive firstname search
                    { lastname: { $regex: searchData, $options: 'i' } }, // Case-insensitive lastname search
                    { rollno: { $regex: searchData, $options: 'i' } }, // Case-insensitive rollno search
                    { mobileno: { $regex: searchData, $options: 'i' } }, // Case-insensitive mobileno search
                    { parentsmobile: { $regex: searchData, $options: 'i' } }, // Case-insensitive parentsmobile search
                    { address: { $regex: searchData, $options: 'i' } }, // Case-insensitive address search
                    { parentsemail: { $regex: searchData, $options: 'i' } },
                    { parentsname: { $regex: searchData, $options: 'i' } },
                ],
            });

            for (let i = 0; i < students.length; i++) {
                students[i].profile = await update_path("student", students[i].profile);
            }

            return res.status(200).json(students);
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while fetching data. Reload the page again!";
            const newRoute = '/admin/viewStudent';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_update_student_details_page(req, res) {
        try {
            const token = req.query.token;

            if (!token) {
                const headingMessage = "Something went wrong";
                const paragraphMessage = `Invalid URL of the page! Try to contact admin at ${process.env.ADMIN_EMAIL} or ${process.env.ADMIN_CONTACT}`;
                const newRoute = '/user/login';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            // Verify the token
            const decoded = await jwt.verify(token, process.env.JWT_SECRET_KEY);

            const user = await student_model.findById(decoded.user._id);

            if (!user) {
                const headingMessage = "Something went wrong";
                const paragraphMessage = `Invalid URL of the page! Try to contact admin at ${process.env.ADMIN_EMAIL} or ${process.env.ADMIN_CONTACT}`;
                const newRoute = '/user/login';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            if (user.status == 'true') {
                const headingMessage = "Credientials are already verified";
                const paragraphMessage = 'You are already registered! Try to login.';
                const newRoute = '/user/login';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            if (user.status == 'false') {
                const headingMessage = "Wait for admin approval!";
                const paragraphMessage = "We have sent your request to admin! Try login after sometime.";
                const newRoute = '/user/login';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            return res.render('HTML/admin/updateStudentDetails.ejs', { user: user });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = `Page not Found! Try to contact admin at ${process.env.ADMIN_EMAIL} or ${process.env.ADMIN_CONTACT}`;
            const newRoute = '/user/login';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async update_student_details(req, res) {
        try {
            const userId = req.query.id;

            const {
                email,
                firstname,
                lastname,
                rollno,
                mobileno,
                parentsname,
                parentsemail,
                parentsmobile,
                address,
            } = req.body;

            const updatedUser = {
                email,
                firstname,
                lastname,
                rollno,
                mobileno,
                parentsname,
                parentsemail,
                parentsmobile,
                address,
            }

            if (req.files.proof && req.files.proof.length > 0) {
                updatedUser.proof = req.files.proof.map((file) => file.filename);
            }

            if (req.files.profile[0] && rreq.files.profile[0].length > 0) {
                updatedUser.proof = req.files.profile[0].filename;
            }

            updatedUser.status = 'false';

            await student_model.findByIdAndUpdate(userId, updatedUser);

            const headingMessage = 'Your data successfully updated!';
            const paragraphMessage = `Please wait for admin approval! you will receive email once admin approve it.`;
            const newRoute = '/user/login'; // Redirect to the appropriate route
            return res.render('utilities/responseMessageSuccess.ejs', {
                headingMessage: headingMessage,
                paragraphMessage: paragraphMessage,
                newRoute: newRoute,
            });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = 'Student data not updated';
            const newRoute = '/user/login';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_profile_page(req, res) {
        try {
            const userID = req.user._id;

            const admin = await admin_model.findById(userID).select('-password');

            admin.photo = await update_path('admin', admin.photo);

            return res.render('HTML/admin/profile.ejs', { admin: admin });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while fetching data. Reload the page again!";
            const newRoute = '/admin/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async update_profile(req, res) {
        try {
            const userID = req.user._id;

            const { email, phone } = req.body;

            const updated_admin_data = {
                email,
                phone
            };

            await admin_model.findByIdAndUpdate(userID, updated_admin_data);

            const headingMessage = "Updated Succesfully";
            const paragraphMessage = "Your profile data updated succesfully!";
            const newRoute = '/admin/profile';
            return res.render('utilities/responseMessageSuccess.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while updating profile data. Please try again!";
            const newRoute = '/admin/profile';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async reset_hostel(req, res) {
        try {
            const hostelID = req.body.hostelID;

            // Find user IDs from the updated rooms
            const roomsWithUsers = await room_model.find({ hostelID, user: { $exists: true, $ne: [] } });
            const userIds = roomsWithUsers.flatMap(room => room.user);

            // Update students with matching user IDs to set enrolled status to false
            await student_model.updateMany({ _id: { $in: userIds } }, { $set: { enrolled: 'false' } });

            // Update rooms to reset user field
            await room_model.updateMany({ hostelID }, { $set: { user: [] } });

            await hostel_model.findByIdAndUpdate(hostelID, { enrollmentActivity: 'false' });

            return res.status(200).json({ message: 'ok' });
        } catch (error) {
            const headingMessage = 'Something went Wrong';
            const paragraphMessage = 'Error while resetting hostel data. Try to reset hostel data again!';
            const newRoute = '/admin/dashboard';
            return res.status(400).json({ headingMessage, paragraphMessage, newRoute });
        }
    }
};