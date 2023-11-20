const room_controller = require("../controllers/roomController");
const student_model = require('../models/studentModel');
const room_model = require('../models/roomModel');
const attendance_model = require('../models/attendanceModel');
const getFormatedDate = require('../services/getFormatedDate');
const update_path = require('../utilities/response_image_url');
const { default: mongoose } = require("mongoose");
const RoomClass = new room_controller();
const jwt = require("jsonwebtoken");
require('dotenv').config();

module.exports = class Student {
    async load_student_dashboard_page(req, res) {
        try {
            return res.render('HTML/student/studentHome');
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while fetching data. Reload the page again!";
            const newRoute = '/user/login';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_book_hostel_page(req, res) {
        try {
            const userID = req.user._id;

            const student = await student_model.findById(userID);

            const studentEnrolledStatus = student.enrolled;

            if (studentEnrolledStatus == 'true') {
                const headingMessage = "Can not book Room";
                const paragraphMessage = "You can not book room!You already have one booked room. Cancel your current booked room to avail new room.";
                const newRoute = '/student/dashboard';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            const hostelData = await RoomClass.get_hostel_data_for_booking();
            return res.render('HTML/student/bookHostel.ejs', { hostelData: hostelData });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while fetching data. Reload the page again!";
            const newRoute = '/user/login';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_profile_page(req, res) {
        try {
            const userID = req.user._id;

            const student = await student_model.findById(userID).select('-password');

            student.profile = await update_path('student', student.profile);

            return res.render('HTML/student/profile.ejs', { student: student });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while fetching data. Reload the page again!";
            const newRoute = '/student/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async update_profile(req, res) {
        try {
            const userID = req.user._id;

            const { mobileno, address } = req.body;

            const updated_student_data = {
                mobileno,
                address
            };

            await student_model.findByIdAndUpdate(userID, updated_student_data);

            const headingMessage = "Updated Succesfully";
            const paragraphMessage = "Your profile data updated succesfully!";
            const newRoute = '/student/profile';
            return res.render('utilities/responseMessageSuccess.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while updating profile data. Please try again!";
            const newRoute = '/student/profile';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_my_room_details_page(req, res) {
        try {
            const userID = req.user._id;

            const roomDetails = await room_model.aggregate([
                {
                    $match: { user: new mongoose.Types.ObjectId(userID) }
                },
                {
                    $lookup: {
                        from: 'hostels',
                        localField: 'hostelID',
                        foreignField: '_id',
                        as: 'hostel'
                    }
                },
                {
                    $lookup: {
                        from: 'students',
                        localField: 'user',
                        foreignField: '_id',
                        as: 'student'
                    }
                }
            ]);

            if (roomDetails.length > 0) {
                for (var i = 0; i < roomDetails[0].student.length; i++) {
                    roomDetails[0].student[i].profile = await update_path('student', roomDetails[0].student[i].profile);
                }
            }

            return res.render('HTML/student/myRoomDetails.ejs', { roomDetails: roomDetails });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while fetching room details. Please try again!";
            const newRoute = '/student/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_get_otp_page(req, res) {
        try {
            const student = await student_model.findById(req.user._id).select('-password');

            if (student.enrolled == 'false') {
                const headingMessage = "Cannot access this functionality";
                const paragraphMessage = "To use this functionality you need to book a room in hostel!";
                const newRoute = '/student/dashboard';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            if (!student.attendanceToken) {
                const headingMessage = "No OTP Found!";
                const paragraphMessage = "Ask your warden to send fresh new OTP!";
                const newRoute = '/student/dashboard';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            const attendanceToken = student.attendanceToken;

            // Verify the token
            const decoded = jwt.verify(attendanceToken, process.env.JWT_SECRET_KEY);

            return res.render('HTML/student/markAttendance.ejs', { decoded });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while loading the page. Please try again!";
            const newRoute = '/student/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_view_attendance_page(req, res) {
        try {
            const studentName = req.user.firstname + " " + req.user.lastname;
            const rollNo = req.user.rollno;
            const studentID = new mongoose.Types.ObjectId(req.user._id);

            const currentDate = new Date();
            const finalDate = await getFormatedDate(currentDate);

            const filter = {
                $and: [
                    {
                        $or: [
                            { present: studentID },
                            { absent: studentID },
                            { leave: studentID }
                        ]
                    },
                    { date: { $ne: finalDate } } // Exclude the specific date
                ]
            };

            const result = await attendance_model.find(filter).exec();

            const totalCount = result.length;
            const presentCount = result.filter(doc => doc.present.includes(studentID)).length;
            const absentCount = result.filter(doc => doc.absent.includes(studentID)).length;
            const leaveCount = result.filter(doc => doc.leave.includes(studentID)).length;
            const percentage = ((presentCount / totalCount) * 100).toFixed(2); // Calculate percentage

            const status = result.map(doc => {
                const dateString = doc.date;
                const formattedDate = `${dateString.slice(0, 2)}/${dateString.slice(2, 4)}/${dateString.slice(4)}`;

                if (doc.present.includes(studentID)) {
                    return { date: formattedDate, status: 'present' };
                } else if (doc.absent.includes(studentID)) {
                    return { date: formattedDate, status: 'absent' };
                } else if (doc.leave.includes(studentID)) {
                    return { date: formattedDate, status: 'leave' };
                }
            });


            const templateData = {
                studentName: studentName,
                rollNo: rollNo,
                totalCount: totalCount,
                presentCount: presentCount,
                absentCount: absentCount,
                leaveCount: leaveCount,
                status: status,
                percentage: percentage
            }

            return res.render('HTML/student/viewAttendance.ejs', { templateData: templateData });
        } catch (error) {
            console.log(error);
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while loading the page. Please try again!";
            const newRoute = '/student/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }
}