const hostel_model = require('../models/hostelModel');
const warden_model = require('../models/wardenModel');
const room_model = require('../models/roomModel');
const student_model = require('../models/studentModel');
const update_path = require('../utilities/response_image_url');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { sendEmailToMultipleUsers } = require('../services/sendEmailService');
const { default: mongoose } = require('mongoose');

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
};