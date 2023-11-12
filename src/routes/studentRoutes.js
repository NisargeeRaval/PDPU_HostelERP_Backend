const express = require("express");
const router = express.Router();
const student_controller = require("../controllers/studentController");
const jwt_middleware = require('../middleware/jwtMiddleware');
const student_middlware = require('../middleware/studentMiddleware');

const StudentClass = new student_controller();

router.get("/dashboard", jwt_middleware, student_middlware, (req, res) => StudentClass.load_student_dashboard_page(req, res));
router.get("/bookHostel", jwt_middleware, student_middlware, (req, res) => StudentClass.load_book_hostel_page(req, res));
router.get('/profile', jwt_middleware, student_middlware, (req, res) => StudentClass.load_profile_page(req, res));
router.post('/updateProfile', jwt_middleware, student_middlware, (req, res) => StudentClass.update_profile(req, res));

module.exports = router;