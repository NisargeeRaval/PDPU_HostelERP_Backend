const student_model = require('../models/studentModel');
const admin_model = require('../models/adminModel');
const warden_model = require('../models/wardenModel');
const parents_model = require('../models/parentsModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../services/sendEmailService');

require('dotenv').config();

module.exports = class Basic {

    async load_login_page(req, res) {
        try {
            //if already login in redirect to dashboard page
            if (req.cookies.token) {
                const token = req.cookies.token;

                const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

                const role = decoded.role;

                if (role == 'student') {
                    return res.render('HTML/student/studentHome.ejs');
                } else if (role == 'admin') {
                    return res.render('HTML/admin/adminHome.ejs');
                } else if (role == 'warden') {
                    return res.render('HTML/warden/wardenHome.ejs');
                } else if (role == 'parents') {
                    return res.render('HTML/parents/parentsHome.ejs');
                }
            }

            return res.render('HTML/basic/login');
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while fetching data. Reload the page again!";
            const newRoute = '/';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async login(req, res) {
        try {

            const { email, password } = req.body;

            const student = await student_model.findOne({
                $or: [{ email: email }, { mobileno: email }, { rollno: email }]
            });
            if (student) {
                const isApproved = student.status;

                if (isApproved == 'false') {
                    const headingMessage = "Wait for admin approval!";
                    const paragraphMessage = "We have sent your request to admin! Try login after sometime.";
                    const newRoute = '/user/login';
                    return res.status(403).json({ headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
                }

                const isPasswordValid = await bcrypt.compare(password, student.password);
                if (!isPasswordValid) {
                    const headingMessage = "Error while login!";
                    const paragraphMessage = "Incorrect Password. Try to login with correct password or change password!";
                    const newRoute = '/user/login';
                    return res.status(403).json({ headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
                }

                const payload = {
                    _id: student._id,
                    email: student.email,
                    firstname: student.firstname,
                    lastname: student.lastname,
                    rollno: student.rollno,
                    mobile: student.mobileno,
                    parentsname: student.parentsname,
                    parentsemail: student.parentsemail,
                    parentsmobile: student.parentsmobile,
                    address: student.address,
                    parentsid: student.parentsid,
                    role: 'student'
                };

                const token = jwt.sign(payload, process.env.JWT_SECRET_KEY);
                const maxAge = 24 * 60 * 60 * 1000;

                res.cookie('token', token, {
                    maxAge
                });

                return res.status(200).json({ token: token, role: 'student' });
            }

            const admin = await admin_model.findOne({
                $or: [{ email: email }, { phone: email }]
            });
            if (admin) {
                const isPasswordValid = await bcrypt.compare(password, admin.password);
                if (!isPasswordValid) {
                    const headingMessage = "Error while login!";
                    const paragraphMessage = "Incorrect Password. Try to login with correct password or change password!";
                    const newRoute = '/user/login';
                    return res.status(403).json({ headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
                }

                const payload = {
                    _id: admin._id,
                    email: admin.email,
                    phone: admin.phone,
                    role: 'admin'
                };

                const token = jwt.sign(payload, process.env.JWT_SECRET_KEY);
                const maxAge = 60 * 60 * 1000;

                res.cookie('token', token, {
                    maxAge
                });

                return res.status(200).json({ token: token, role: 'admin' });
            }

            const warden = await warden_model.findOne({
                $or: [{ email: email }, { mobile: email }]
            });
            if (warden) {
                const status = warden.status;
                if (status == 'false') {
                    const headingMessage = "Can not login!";
                    const paragraphMessage = "Your crediential are blocked by admin! Try to contact admin.";
                    const newRoute = '/user/login';
                    return res.status(403).json({ headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
                }

                const isPasswordValid = await bcrypt.compare(password, warden.password);
                if (!isPasswordValid) {
                    const headingMessage = "Error while login!";
                    const paragraphMessage = "Incorrect Password. Try to login with correct password or change password!";
                    const newRoute = '/user/login';
                    return res.status(403).json({ headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
                }

                const payload = {
                    _id: warden._id,
                    wardenName: warden.wardenName,
                    hostel: warden.hostel,
                    mobile: warden.mobile,
                    email: warden.email,
                    role: 'warden'
                };

                const token = jwt.sign(payload, process.env.JWT_SECRET_KEY);
                const maxAge = 3 * 60 * 60 * 1000;

                res.cookie('token', token, {
                    maxAge
                });

                return res.status(200).json({ token: token, role: 'warden' });
            }

            const parents = await parents_model.findOne({
                $or: [{ email: email }, { mobileno: email }]
            });
            if (parents) {
                const isPasswordValid = await bcrypt.compare(password, parents.password);
                if (!isPasswordValid) {
                    const headingMessage = "Error while login!";
                    const paragraphMessage = "Incorrect Password. Try to login with correct password or change password!";
                    const newRoute = '/user/login';
                    return res.status(403).json({ headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
                }

                const student = await student_model.findOne({ parentsid: parents._id }).select('-password');

                const payload = {
                    _id: parents._id,
                    mobileno: parents.mobileno,
                    email: parents.email,
                    name: parents.name,
                    role: 'parents',
                    student_rollno: student.rollno,
                    student_id: student._id,
                    student_email: student.email,
                    student_firstName: student.firstname,
                    student_lastName: student.lastname
                };

                const token = jwt.sign(payload, process.env.JWT_SECRET_KEY);
                const maxAge = 24 * 60 * 60 * 1000;

                res.cookie('token', token, {
                    maxAge
                });

                return res.status(200).json({ token: token, role: 'parents' });
            }

            if (!student && !admin && !warden && !parents) {
                const headingMessage = "Error while login!";
                const paragraphMessage = "User does not exists. Try to Register!";
                const newRoute = '/user/register';
                return res.status(403).json({ headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }
        } catch (error) {
            const headingMessage = "Something went Wrong";
            const paragraphMessage = "Error while login. Try to login again!";
            const newRoute = '/user/login';
            return res.status(400).json({ headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_register_page(req, res) {
        try {
            return res.render('HTML/basic/register');
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while fetching data. Reload the page again!";
            const newRoute = '/user/login';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async register(req, res) {
        try {
            const { email, password, firstname, lastname, rollno, mobileno, parentsmobile, address, parentsname, parentsemail } = req.body;

            // Check if user already exists
            const existingUser = await student_model.findOne({
                $or: [{ email }, { rollno }, { mobileno }]
            });
            if (existingUser) {
                const headingMessage = "Error can not register!";
                const paragraphMessage = "User already exists. Try to login!";
                const newRoute = '/user/login';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
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
                parentsname,
                parentsemail,
                parentsmobile,
                address,
                proof: req.files.proof.map((file) => file.filename),
                profile: req.files.profile[0].filename
            });

            const subject = 'Welcome to PDPU Hostel ERP System - Await Admin Approval';

            const htmlContent = `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to PDPU Hostel ERP System</title>
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
                        <h1>Welcome to PDPU Hostel ERP System</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${firstname + " " + lastname},</p>
                        <p>We are delighted to welcome you to the PDPU Hostel ERP System!</p>
                        <p>You've successfully registered with our system, and we're thrilled to have you on board. Your journey with our Hostel ERP begins now, and we're here to make your hostel experience more convenient and enjoyable.</p>
                        <p><b>Before you can access your account and start using our services, we kindly ask for your patience as our administrators review your registration details. The approval process ensures the security and accuracy of our system, and we'll strive to complete it as swiftly as possible.</b></p>
                        <p>Please allow us some time to verify your information and create your login credentials. Once your account is approved, you'll receive a confirmation email.</p>
                        <p>While you wait, here's a glimpse of what our Hostel ERP System offers:</p>
                        <ul>
                            <li>Convenient Room Booking: Effortlessly book and manage your hostel room.</li>
                            <li>Quick Complaint Resolution: Report and track any issues, and we'll address them promptly.</li>
                            <li>Stay Informed: Receive important announcements and updates from the hostel administration.</li>
                        </ul>
                        <p>If you have any questions or need assistance during this process, please feel free to reach out to our support team at ${process.env.ADMIN_EMAIL}. We're here to help!</p>
                        <p>Thank you for choosing the PDPU Hostel ERP System. We look forward to making your hostel life more organized and hassle-free. Your approval notification will be sent to you shortly.</p>
                        <p>Warm regards,</p>
                        <p><b>${process.env.ADMIN_NAME}</b><br>ADMIN<br>PDPU Hostel ERP System</p>
                    </div>
                </div>
            </body>
            </html>
            `;

            sendEmail(email, subject, '', htmlContent, (error, info) => {
                if (error) {
                    res.status(500).json({ error: 'An error occurred while sending the email' });
                } else {
                    res.status(201).json({ message: 'User registered successfully' });
                }
            });

            await user.save();

            const headingMessage = "Succesfully registered!";
            const paragraphMessage = "Wait for admin approval!";
            const newRoute = '/user/login';
            return res.render('utilities/responseMessageSuccess.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while registering. Try to register again!";
            const newRoute = '/user/register';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_forget_password_page(req, res) {
        try {
            return res.render('HTML/basic/forgetPassword');
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while fetching data. Reload the page again!";
            const newRoute = '/';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async forget_password(req, res) {
        try {
            const { email } = req.body;

            const student = await student_model.findOne({ email });
            if (student) {
                const isApproved = student.status;

                if (isApproved == 'false') {
                    const headingMessage = "Wait for admin approval!";
                    const paragraphMessage = "We have sent your request to admin! Try login after sometime.";
                    const newRoute = '/user/login';
                    return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
                }

                const studentName = student.firstname + " " + student.lastname

                this.sendForgetPasswordLink(student.email, studentName);
                const headingMessage = "Email Sent Succesfully!";
                const paragraphMessage = "We have send an email to your registered email ID for password reset.";
                const newRoute = '/user/login';
                return res.render('utilities/responseMessageSuccess.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            const warden = await warden_model.findOne({ email });
            if (warden) {
                const status = warden.status;
                if (status == 'false') {
                    const headingMessage = "Can not login!";
                    const paragraphMessage = "Your crediential are blocked by admin! Try to contact admin.";
                    const newRoute = '/user/login';
                    return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
                }

                this.sendForgetPasswordLink(warden.email, warden.wardenName);
                const headingMessage = "Email Sent Succesfully!";
                const paragraphMessage = "We have send an email to your registered email ID for password reset.";
                const newRoute = '/user/login';
                return res.render('utilities/responseMessageSuccess.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            const parents = await parents_model.findOne({ email });
            if (parents) {
                this.sendForgetPasswordLink(parents.email, parents.name);
                const headingMessage = "Email Sent Succesfully!";
                const paragraphMessage = "We have send an email to your registered email ID for password reset.";
                const newRoute = '/user/login';
                return res.render('utilities/responseMessageSuccess.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            if (!student && !warden && !parents) {
                const headingMessage = "Error while login!";
                const paragraphMessage = "User does not exists. Try to Register!";
                const newRoute = '/user/register';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

        } catch (error) {
            const headingMessage = "Something went Wrong";
            const paragraphMessage = "Error while performing forget password. Try to do the process again!";
            const newRoute = '/user/forgetPassword';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async sendForgetPasswordLink(email, name) {
        const token = jwt.sign({ email: email, name: name, date: Math.floor(Date.now() / 1000) }, process.env.JWT_SECRET_KEY);
        const resetPasswordLink = `${process.env.SERVER_URL}/user/resetPassword?token=${token}`;
        const subject = 'Password Reset - PDPU Hostel ERP System';

        const htmlContent = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - PDPU Hostel ERP System</title>
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
                    <h1>Password Reset - PDPU Hostel ERP System</h1>
                </div>
                <div class="content">
                    <p>Dear ${name},</p>
                    <p>We have received a request to reset your password for the PDPU Hostel ERP System.</p>
                    <p>To reset your password, click the button below:</p>
                    <a href="${resetPasswordLink}" class="button">Reset Password</a>
                    <p><b>The password reset link is active for the next 15 minutes only. After that, it will expire for security reasons.</b></p>
                    <p>If you didn't request a password reset, please ignore this email. Your account remains secure.</p>
                    <p>For any assistance or questions, please contact our support team at ${process.env.ADMIN_EMAIL}.</p>
                    <p>Thank you for using the PDPU Hostel ERP System.</p>
                    <p>Best regards,</p>
                    <p><b>${process.env.ADMIN_NAME}</b><br>ADMIN<br>PDPU Hostel ERP System</p>
                </div>
            </div>
        </body>
        </html>
        `;

        sendEmail(email, subject, '', htmlContent, (error, info) => {
            if (error) {
                res.status(500).json({ error: 'An error occurred while sending the email' });
            } else {
                res.status(201).json({ message: 'Password reset email sent successfully' });
            }
        });

    }

    async load_reset_password_page(req, res) {
        try {
            const token = req.query.token;
            return res.render('HTML/basic/resetPassword', { token: token });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while fetching data. Reload the page again!";
            const newRoute = '/';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async reset_password(req, res) {
        try {
            const token = req.query.token;

            const newPassword = req.body.newPassword;

            const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);

            if (!decodedToken || !decodedToken.iat) {
                const headingMessage = "Something went Wrong";
                const paragraphMessage = "The Password Rest Link is not valid! Try to get new link.";
                const newRoute = '/user/forgetPassword';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            const currentTime = Math.floor(Date.now() / 1000); // Convert current time to seconds

            const tokenCreationTime = decodedToken.iat;

            const tokenValidityPeriod = 15 * 60; // 15 minutes in seconds

            if (currentTime - tokenCreationTime > tokenValidityPeriod) {
                const headingMessage = "Token Expired.";
                const paragraphMessage = "The Password Rest Link is not valid as it has exceed from it time limit! Try to get new link.";
                const newRoute = '/user/forgetPassword';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            const email = decodedToken.email;

            const student = await student_model.findOne({ email });
            if (student) {
                const isApproved = student.status;

                if (isApproved == 'false') {
                    const headingMessage = "Wait for admin approval!";
                    const paragraphMessage = "We have sent your request to admin! Try login after sometime.";
                    const newRoute = '/user/login';
                    return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
                }

                student.password = await bcrypt.hash(newPassword, 10);

                await student.save();

                const headingMessage = "Password Reset Succesfully!";
                const paragraphMessage = "Password is succesfully reset for your account! Try to login.";
                const newRoute = '/user/login';
                return res.render('utilities/responseMessageSuccess.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            const warden = await warden_model.findOne({ email });
            if (warden) {
                const status = warden.status;
                if (status == 'false') {
                    const headingMessage = "Can not login!";
                    const paragraphMessage = "Your crediential are blocked by admin! Try to contact admin.";
                    const newRoute = '/user/login';
                    return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
                }

                warden.password = await bcrypt.hash(newPassword, 10);

                await warden.save();

                const headingMessage = "Password Reset Succesfully!";
                const paragraphMessage = "Password is succesfully reset for your account! Try to login.";
                const newRoute = '/user/login';
                return res.render('utilities/responseMessageSuccess.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            const parents = await parents_model.findOne({ email });
            if (parents) {
                parents.password = await bcrypt.hash(newPassword, 10);

                await parents.save();

                const headingMessage = "Password Reset Succesfully!";
                const paragraphMessage = "Password is succesfully reset for your account! Try to login.";
                const newRoute = '/user/login';
                return res.render('utilities/responseMessageSuccess.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            if (!student && !warden && !parents) {
                const headingMessage = "Error while login!";
                const paragraphMessage = "User does not exists. Try to Register!";
                const newRoute = '/user/register';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }
        } catch (error) {
            const headingMessage = "Something went Wrong";
            const paragraphMessage = "The Password Rest Link is not valid! Try to get new link.";
            const newRoute = '/user/forgetPassword';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async logout(req, res) {
        try {
            res.clearCookie('token');
            res.status(200).json({ success: true }); // Send a JSON response to the client
        } catch (error) {
            console.log(error);
        }
    }
}