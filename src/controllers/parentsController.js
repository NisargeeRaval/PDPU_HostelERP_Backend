const student_model = require('../models/studentModel');
const update_path = require('../utilities/response_image_url');

module.exports = class Parents {

    async load_dashboard_page(req, res) {
        try {
            return res.render('HTML/parents/parentsHome.ejs');
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while fetching data. Reload the page again!";
            const newRoute = '/user/login';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_profile_page(req, res) {
        try {
            const student = await student_model.findById(req.user.student_id);

            student.profile = await update_path("student", student.profile);

            const templateData = {
                _id: req.user._id,
                mobileno: req.user.mobileno,
                email: req.user.email,
                name: req.user.name,
                student
            }

            return res.render('HTML/parents/profile.ejs', { templateData: templateData });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while fetching data. Reload the page again!";
            const newRoute = '/parents/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }
};