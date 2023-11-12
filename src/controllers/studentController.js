const room_controller = require("../controllers/roomController");
const student_model = require('../models/studentModel');
const update_path = require('../utilities/response_image_url');
const RoomClass = new room_controller();

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
}