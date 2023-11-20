require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const connectToDatabase = require('../config/mongoDB');
const cron = require('node-cron');
const attendance_model = require('../models/attendanceModel');
const student_model = require('../models/studentModel');
const { sendEmailWithCC } = require('./sendEmailService');

connectToDatabase()
    .then(() => {
        cron.schedule('15 0 * * *', async () => {
            console.log('---------->sending mail');
            try {
                // Get the current date
                const currentDate = new Date();

                // Calculate the previous date by subtracting one day (24 hours in milliseconds)
                const previousDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);

                // Get the date, month, and year from the previousDate
                const previousDay = previousDate.getDate(); // Day (date)
                const previousMonth = previousDate.getMonth() + 1; // Month (adding 1 because month starts from 0)
                const previousYear = previousDate.getFullYear(); // Year

                const finalDate = previousDay + "" + previousMonth + "" + previousYear;
                const formattedDate = previousDay + '/' + previousMonth + '/' + previousYear;

                const attendance = await attendance_model.findOne({ date: finalDate });

                const absentUser = attendance.absent;

                const students = await student_model.find({ _id: { $in: absentUser } }).select('email firstname lastname parentsemail parentsname');

                console.log(students);

                for (var i = 0; i < students.length; i++) {
                    const subject = `Notification: Absence of ${students[i].firstname + " " + students[i].lastname} from Hostel on ${formattedDate}`
                    const htmlContent = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>PDPU Hostel ERP System - Absence Notification</title>
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
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>PDPU Hostel ERP System - Absence Notification</h1>
                            </div>
                            <div class="content">
                                <p>Dear ${students[i].parentsname},</p>
                                <p>We hope this message finds you well.</p>
                                <p>We're writing to inform you that your child <b>${students[i].firstname + " " + students[i].lastname}</b>, was marked as absent from the hostel on <b>${formattedDate}</b>.</p>
                                <p>This notification is to bring to your attention the absence of your child from the hostel premises on the mentioned date. <b>We understand the importance of student safety and well-being, and we recommend that you take appropriate action and communicate with your student regarding their absence</b>.</p>
                                <p>Please feel free to reach out to us at ${process.env.ADMIN_EMAIL + " or " + process.env.ADMIN_CONTACT} for any further information or clarification regarding this absence.</p>
                                <p>Thank you for your attention to this matter.</p>
                                <p>Warm regards,</p>
                                <p><b>${process.env.ADMIN_NAME}</b><br>Administrator<br>PDPU Hostel ERP System</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    `;

                    sendEmailWithCC(students[i].parentsemail, subject, '', htmlContent, students[i].email, (error, info) => {
                        if (error) {
                            console.log({ error: 'An error occurred while sending the email' });
                        } else {
                            console.log({ message: 'Email sent' });
                        }
                    });
                }


            } catch (error) {
                console.error('Error occurred during attendance creation:', error);
            }
        }, {
            scheduled: true,
            timezone: 'Asia/Kolkata'
        });
    })
    .catch((error) => {
        console.error('DB connection error:', error);
    });
