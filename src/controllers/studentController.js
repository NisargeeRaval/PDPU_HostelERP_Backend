const room_controller = require("../controllers/roomController");
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
}