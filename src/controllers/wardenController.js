const hostel_model = require('../models/hostelModel');
const warden_model = require('../models/wardenModel');
const room_model = require('../models/roomModel');
const attendance_model = require('../models/attendanceModel');
const getFormatedDate = require('../services/getFormatedDate');
const expense_model = require("../models/expenseModel")
const student_model = require('../models/studentModel');
const update_path = require('../utilities/response_image_url');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const { sendEmailToMultipleUsers } = require('../services/sendEmailService');
const { default: mongoose } = require('mongoose');
require('dotenv').config();

module.exports = class Warden {
    constructor() {
        if (Warden.instance) {
            return Warden.instance; // Return the existing instance if it already exists
        }

        this.hostelData = null;
        this.wardenData = null;

        this.loadHostelData();
        this.loadWardenData();

        Warden.instance = this; // Store the instance
    }

    async loadHostelData() {
        try {
            this.hostelData = await hostel_model.find({}).select('_id hostelName');
        } catch (error) {
            console.error('Error while fetching hostel data:', error);
        }
    }

    async loadWardenData() {
        try {
            const result = await warden_model.aggregate([
                {
                    $lookup: {
                        from: 'hostels',
                        localField: 'hostel',
                        foreignField: '_id',
                        as: 'hostel'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        wardenName: 1,
                        wardenPhoto: 1,
                        mobile: 1,
                        email: 1,
                        status: 1,
                        'hostelName': { $arrayElemAt: ['$hostel.hostelName', 0] }
                    }
                }
            ]);

            for (let i = 0; i < result.length; i++) {
                result[i].wardenPhoto = await update_path("warden", result[i].wardenPhoto);
            }
            this.wardenData = result;
        } catch (error) {
            console.error('Error while fetching hostel data:', error);
        }
    }

    async load_warden_dashboard_page(req, res) {
        try {
            return res.render('HTML/warden/wardenHome.ejs');
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while loading page. Reload the page again!";
            const newRoute = '/warden/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_add_warden_page(req, res) {
        try {
            return res.render('HTML/admin/addWarden.ejs', { hostel: this.hostelData, warden: this.wardenData });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while loading page. Reload the page again!";
            const newRoute = '/admin/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_view_warden_page(req, res) {
        try {
            return res.render('HTML/admin/viewWarden.ejs', { hostel: this.hostelData, warden: this.wardenData });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while loading page. Reload the page again!";
            const newRoute = '/admin/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async register_warden(req, res) {
        try {
            const { wardenName, hostel, mobile, email, password } = req.body;

            // Check if a warden with the same email or mobile number already exists
            const existingWarden = await warden_model.findOne({
                $or: [{ email }, { mobile }],
            });

            if (existingWarden) {
                const headingMessage = "Data Duplication!";
                const paragraphMessage = "Warden already exist!";
                const newRoute = '/warden/add';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create a new warden instance
            const newWarden = new warden_model({
                wardenName,
                hostel,
                mobile,
                email,
                password: hashedPassword,
                wardenPhoto: req.file.filename,
                status: 'true'
            });

            // Save the warden to the database
            await newWarden.save();

            // Reload the warden data
            await this.loadWardenData();

            return res.render('HTML/admin/viewWarden.ejs', { hostel: this.hostelData, warden: this.wardenData });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while registering warden. Register warden again!";
            const newRoute = '/warden/add';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async update_warden(req, res) {
        try {
            const { wardenName, hostel, mobile, email, status } = req.body;

            const warden_id = req.query.id;

            const warden = await warden_model.findById(warden_id);

            if (!warden) {
                const headingMessage = "Something went wrong";
                const paragraphMessage = "Error while updating warden. Warden not found. Try to add warden!";
                const newRoute = '/warden/add';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            const updateWarden = {
                wardenName,
                hostel,
                mobile,
                email,
                status
            }

            if (req.file) {
                updateWarden.wardenPhoto = req.file.filename;
            }

            await warden_model.findByIdAndUpdate(warden_id, updateWarden);

            // Reload the warden data
            await this.loadWardenData();

            const headingMessage = "Warden Successfully Updated!";
            const paragraphMessage = `Click "OK" to view the updated warden details!`;
            const newRoute = '/warden/view'; // Redirect to the appropriate route
            return res.render('utilities/responseMessageSuccess.ejs', {
                headingMessage: headingMessage,
                paragraphMessage: paragraphMessage,
                newRoute: newRoute,
            });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while updating warden. Update warden details again!";
            const newRoute = '/warden/view';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_send_email_page(req, res) {
        try {
            const warden = req.user;
            const currentDate = new Date(); // Create a new Date object representing the current date and time

            const year = currentDate.getFullYear(); // Get the current year (e.g., 2023)
            const month = currentDate.getMonth(); // Get the current month (0-11, where 0 is January)
            const day = currentDate.getDate(); // Get the current day of the month (1-31)
            const hours = currentDate.getHours(); // Get the current hour (0-23)
            const minutes = currentDate.getMinutes(); // Get the current minutes (0-59)
            const seconds = currentDate.getSeconds(); // Get the current seconds (0-59)

            // Format the date and time as a string
            const formattedDate = `${year}-${month + 1}-${day}`; // Adding 1 to month since it's zero-based
            const formattedTime = `${hours}:${minutes}:${seconds}`;

            const emailMessage = `<!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }
            
                    .container {
                        background-color: #ffffff;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
            
                    .header {
                        background-color: #007BFF;
                        color: #fff;
                        padding: 10px 0;
                        text-align: center;
                    }
            
                    .header h1 {
                        font-size: 24px;
                        margin: 0;
                    }
            
                    .from {
                        text-align: center;
                        margin-bottom: 20px;
                    }
            
                    .notice {
                        padding: 20px;
                    }
            
                    .notice h2 {
                        font-size: 20px;
                    }
            
                    .notice p {
                        font-size: 16px;
                    }
            
                    .footer {
                        background-color: #007BFF;
                        color: #fff;
                        padding: 10px 0;
                        text-align: center;
                    }
            
                    .signature {
                        text-align: center;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>[Title]</h1>
                    </div>
            
                    <div class="from">
                        <p>From: ${warden.wardenName} &lt;${warden.email}&gt;</p>
                        <p>Date: ${formattedDate}</p>
                        <p>Time: ${formattedTime}</p>
                    </div>
            
                    <div class="notice">
                        <h2>[Sub Title]</h2>
                        <p>
                            Dear Students,
                            <br><br>
                            This is to inform you that there will be a hostel meeting on the following date and time:
                            <br><br>
                            Date: [Insert Date]
                            <br>
                            Time: [Insert Time]
                            <br><br>
                            Please make sure to attend the meeting on time. Your presence is important, and we will be discussing important matters related to the hostel.
                            <br><br>
                            Thank you.
                        </p>
                    </div>
            
                    <div class="footer">
                        &copy; Hostel Management System
                    </div>
            
                    <div class="signature">
                        <p>Regards,</p>
                        <p>${warden.wardenName}</p>
                    </div>
                </div>
            </body>
            </html>
            `;

            return res.render('HTML/warden/sendEmail.ejs', { emailMessage: emailMessage });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while loading page. Reload the page again!";
            const newRoute = '/warden/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async send_mail(req, res) {
        try {
            const receiverType = req.body.receiver;
            const subject = req.body.subject;
            const message = req.body.message;
            const wardenHostelID = req.user.hostel;

            // Create a copy of req.files to avoid modification
            const uploadedFiles = [...req.files];

            const attachments = uploadedFiles && Array.isArray(uploadedFiles)
                ? uploadedFiles.map(file => ({
                    filename: file.originalname,
                    content: fs.createReadStream(file.path), // Read the content of the file
                }))
                : [];

            let students = [];

            if (receiverType === 'enrolled') {
                students = await student_model.aggregate([
                    {
                        $match: {
                            enrolled: 'true', // Find enrolled students
                        },
                    },
                    {
                        $lookup: {
                            from: 'rooms', // Collection name for Room model
                            localField: '_id',
                            foreignField: 'user',
                            as: 'rooms',
                        },
                    },
                    {
                        $unwind: '$rooms', // Unwind the array of rooms
                    },
                    {
                        $match: {
                            'rooms.hostelID': new mongoose.Types.ObjectId(wardenHostelID), // Filter by the provided hostelID
                        },
                    },
                ]);
            } else if (receiverType === 'non-enrolled') {
                students = await student_model.find({ enrolled: 'false' });
            } else if (receiverType === 'all') {
                students = await student_model.find({});
            } else {
                const headingMessage = "No recipients found";
                const paragraphMessage = "Try to contact admin.";
                const newRoute = '/warden/sendEmail';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            // Extract email addresses of the selected students
            const recipients = students.map(student => student.email);

            sendEmailToMultipleUsers(recipients, subject, '', message, attachments, (error, info) => {
                if (error) {
                    if (attachments && Array.isArray(attachments)) {
                        attachments.forEach((attachment) => {
                            if (attachment.content) {
                                // Use fs.unlink to delete the file
                                fs.unlink(attachment.content.path, (unlinkError) => {
                                    if (unlinkError) {
                                        console.error('Error deleting attachment:', unlinkError);
                                    }
                                });
                            }
                        });
                    }
                    const headingMessage = "Something went wrong! Try to send email again.";
                    const paragraphMessage = "Error sending email: " + error;
                    const newRoute = '/warden/sendEmail';
                    return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
                } else {
                    if (attachments && Array.isArray(attachments)) {
                        attachments.forEach((attachment) => {
                            if (attachment.content) {
                                // Use fs.unlink to delete the file
                                fs.unlink(attachment.content.path, (unlinkError) => {
                                    if (unlinkError) {
                                        console.error('Error deleting attachment:', unlinkError);
                                    }
                                });
                            }
                        });
                    }
                    const headingMessage = "Email send successfully";
                    const paragraphMessage = "Email sent to all recipients => " + recipients;
                    const newRoute = '/warden/sendEmail';
                    return res.render('utilities/responseMessageSuccess.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
                }
            });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Unable to send Email! Please try again after verifying if the user received an email or not.";
            const newRoute = '/warden/sendEmail';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_profile_page(req, res) {
        try {
            const userID = req.user._id;

            const warden = await warden_model.aggregate([
                {
                    $match: { _id: new mongoose.Types.ObjectId(userID) }
                },
                {
                    $lookup:
                    {
                        from: 'hostels',
                        localField: 'hostel',
                        foreignField: '_id',
                        as: 'hostel'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        wardenName: 1,
                        wardenPhoto: 1,
                        mobile: 1,
                        email: 1,
                        status: 1,
                        'hostelName': { $arrayElemAt: ['$hostel.hostelName', 0] }
                    }
                }
            ]);

            warden[0].wardenPhoto = await update_path('warden', warden[0].wardenPhoto);

            return res.render('HTML/warden/profile.ejs', { warden: warden[0] });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while fetching data. Reload the page again!";
            const newRoute = '/warden/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async update_profile(req, res) {
        try {
            const userID = req.user._id;

            const { mobile } = req.body;

            const updated_warden_data = {
                mobile
            };

            await warden_model.findByIdAndUpdate(userID, updated_warden_data);

            // Reload the warden data
            await this.loadWardenData();

            const headingMessage = "Updated Succesfully";
            const paragraphMessage = "Your profile data updated succesfully!";
            const newRoute = '/warden/profile';
            return res.render('utilities/responseMessageSuccess.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while updating profile data. Please try again!";
            const newRoute = '/admin/profile';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_add_expense_page(req, res) {
        try {
            return res.render('HTML/warden/addExpense.ejs');
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while loading page. Reload the page again!";
            const newRoute = '/warden/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async add_expense(req, res) {
        try {
            const warden = req.user._id;
            const hostel = req.user.hostel;
            const expenseAmount = req.body.amount;
            const reason = req.body.reason;
            const expense = new expense_model({
                hostel,
                warden,
                expenseAmount,
                reason
            });

            await expense.save()

            const headingMessage = "Expense Succesfully Added!";
            const paragraphMessage = `Click "OK" to view expenses!`;
            const newRoute = '/warden/logExpenses';
            return res.render('utilities/responseMessageSuccess.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while adding Expense. Try adding the expense again!";
            const newRoute = '/warden/addExpense';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_log_expenses(req, res) {
        try {
            const role = req.user.role;

            let expenses;

            if (role == 'admin') {
                expenses = await expense_model.aggregate([
                    {
                        $lookup: {
                            from: 'wardens',
                            localField: 'warden',
                            foreignField: '_id',
                            as: 'wardenInfo'
                        }
                    },
                    {
                        $lookup: {
                            from: 'hostels',
                            localField: 'hostel',
                            foreignField: '_id',
                            as: 'hostelInfo'
                        }
                    },
                    {
                        $project: {
                            expenseAmount: 1,
                            reason: 1,
                            createdAt: 1,
                            warden: { $arrayElemAt: ['$wardenInfo', 0] },
                            hostel: { $arrayElemAt: ['$hostelInfo', 0] }
                        }
                    }
                ]);
            }

            if (role == 'warden') {
                const hostelID = req.user.hostel;

                expenses = await expense_model.aggregate([
                    {
                        $match: { hostel: new mongoose.Types.ObjectId(hostelID) }
                    },
                    {
                        $lookup: {
                            from: 'wardens',
                            localField: 'warden',
                            foreignField: '_id',
                            as: 'wardenInfo'
                        }
                    },
                    {
                        $lookup: {
                            from: 'hostels',
                            localField: 'hostel',
                            foreignField: '_id',
                            as: 'hostelInfo'
                        }
                    },
                    {
                        $project: {
                            expenseAmount: 1,
                            reason: 1,
                            createdAt: 1,
                            warden: { $arrayElemAt: ['$wardenInfo', 0] },
                            hostel: { $arrayElemAt: ['$hostelInfo', 0] }
                        }
                    }
                ]);
            }
            return res.render('HTML/warden/logExpenses.ejs', { expenses });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while loading expense log. Please try again later.";
            const newRoute = '/warden/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage, paragraphMessage, newRoute });

        }
    }

    async load_take_attendance_page(req, res) {
        try {
            const currentDate = new Date();
            const finalDate = await getFormatedDate(currentDate);

            const hostelID = req.user.hostel;

            const hostel = await hostel_model.findById(hostelID);

            const attendance_result = await attendance_model.findOne({ date: finalDate, hostel: new mongoose.Types.ObjectId(hostelID) });

            if (!attendance_result) {
                const headingMessage = "Cannot access the attendance page.";
                const paragraphMessage = "The alloted time for today's attendace time is 08:00 PM to 11:00 PM. Please come back after 08:00 PM.";
                const newRoute = '/warden/dashboard';
                return res.render('utilities/responseMessageError.ejs', { headingMessage, paragraphMessage, newRoute });
            }

            // Get the list of student IDs from attendance_result
            const studentIDs = [
                ...attendance_result.present,
                ...attendance_result.absent,
                ...attendance_result.leave
            ];

            // Find student details based on IDs
            const studentDetails = await student_model.find({ _id: { $in: studentIDs } });

            // Prepare an object with student details including status
            const studentData = studentDetails.map(student => {
                const status = {
                    present: attendance_result.present.includes(student._id),
                    absent: attendance_result.absent.includes(student._id),
                    onLeave: attendance_result.leave.includes(student._id)
                };

                return {
                    _id: student._id,
                    name: `${student.firstname} ${student.lastname}`, // Assuming student has firstName and lastName fields
                    status: status,
                    // Other student details you want to include
                };
            });

            // Get room data based on student IDs in the room model
            const roomDetails = await room_model.find({ user: { $in: studentIDs } }).sort({ roomNumber: 1 }) // Sort by roomNumber in ascending order
                .collation({ locale: "en_US", numericOrdering: true }); // Ensure numeric sorting;

            // Prepare an object with room details
            const roomData = roomDetails.map(room => ({
                _id: room._id,
                roomNumber: room.roomNumber,
                students: studentData.filter(student => room.user.includes(student._id))
            }));

            // Prepare an object to pass to the template
            const templateData = {
                wardenID: req.user._id,
                wardenName: req.user.wardenName,
                roomData: roomData,
                currentDate: currentDate,
                hostelName: hostel.hostelName,
                attendance: attendance_result._id.toString()
            };

            return res.render('HTML/warden/takeAttendance.ejs', { templateData: templateData });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while loading page. Reload the page again!";
            const newRoute = '/warden/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage, paragraphMessage, newRoute });
        }
    }

    async send_otp_for_attendance(req, res) {
        try {
            const currentDate = new Date();

            const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
            const formattedTime = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;

            // Calculate time after 5 minutes
            const fiveMinutesLater = new Date(currentDate.getTime() + 5 * 60000); // 5 minutes in milliseconds
            const formattedFiveMinutesLater = `${fiveMinutesLater.getHours().toString().padStart(2, '0')}:${fiveMinutesLater.getMinutes().toString().padStart(2, '0')}`;

            // Generate a time-based OTP
            const secret = speakeasy.generateSecret({ length: 6 }); // Adjust the length as needed
            const OTP = speakeasy.totp({
                secret: secret.base32,
                encoding: 'base32',
            });

            const payload = {
                studentID: req.body.studentID,
                wardenID: req.user._id,
                wardenName: req.user.wardenName,
                createdDateAt: formattedDate,
                createdTimeAt: formattedTime,
                expiredTimeAt: formattedFiveMinutesLater,
                OTP: OTP
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET_KEY);

            await student_model.findByIdAndUpdate(req.body.studentID, { attendanceToken: token }, { new: true });

            return res.status(200).json({ message: 'ok' });
        } catch (error) {
            const headingMessage = "Something went Wrong";
            const paragraphMessage = "Error while sending otp. Try to send otp again!";
            const newRoute = '/warden/takeAttendance';
            return res.status(400).json({ headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async verify_otp_for_attendance(req, res) {
        try {
            const studentID = req.body.studentID;
            const OTP = req.body.inputOTP;
            const attendanceID = req.body.attendanceID;

            const student = await student_model.findById(studentID);
            const attendanceToken = student.attendanceToken;

            if (!attendanceToken) {
                return res.status(400).json({ message: 'OTP does not exists. Generate new OTP!' });
            }

            const decoded = jwt.verify(attendanceToken, process.env.JWT_SECRET_KEY);

            const currentDate = new Date();

            const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
            const formattedTime = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;


            if (!(formattedDate == decoded.createdDateAt && formattedTime <= decoded.expiredTimeAt)) {
                return res.status(400).json({ message: 'OTP expired. Generate new OTP!' });
            }


            if (!(OTP == decoded.OTP)) {
                return res.status(400).json({ message: 'Wrong OTP! Please input correct OTP.' });
            }

            await attendance_model.findByIdAndUpdate(attendanceID, {
                $pull: { absent: studentID },
                $push: { present: studentID }
            }
            );

            return res.status(200).json({ message: 'ok' });
        } catch (error) {
            console.log(error);
            const headingMessage = "Something went Wrong";
            const paragraphMessage = "Error while verifying otp. Try to verify otp again!";
            const newRoute = '/warden/takeAttendance';
            return res.status(400).json({ headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }
};