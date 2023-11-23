const express = require("express");
const router = express.Router();
const student_controller = require("../controllers/studentController");
const jwt_middleware = require('../middleware/jwtMiddleware');
const student_middlware = require('../middleware/studentMiddleware');
const multi_role_based_middleware = require('../middleware/multiRoleBasedMiddleware');

const StudentClass = new student_controller();

router.get("/dashboard", jwt_middleware, student_middlware, (req, res) => StudentClass.load_student_dashboard_page(req, res));
router.get("/bookHostel", jwt_middleware, student_middlware, (req, res) => StudentClass.load_book_hostel_page(req, res));
router.get('/profile', jwt_middleware, student_middlware, (req, res) => StudentClass.load_profile_page(req, res));
router.post('/updateProfile', jwt_middleware, student_middlware, (req, res) => StudentClass.update_profile(req, res));
router.get('/myRoomDetails', jwt_middleware, student_middlware, (req, res) => StudentClass.load_my_room_details_page(req, res));
router.get("/markAttendance", jwt_middleware, student_middlware, (req, res) => StudentClass.load_get_otp_page(req, res));

const student_parents = ['student', 'parents'];
router.get("/viewAttendance", jwt_middleware, multi_role_based_middleware(student_parents), (req, res) => StudentClass.load_view_attendance_page(req, res));

router.get("/complaint", jwt_middleware, student_middlware, (req, res) => StudentClass.load_view_complains_page(req, res));
router.post("/api/complaint", jwt_middleware, student_middlware, (req, res) => StudentClass.add_complaint(req, res));
router.post("/api/acceptComplaint", jwt_middleware, student_middlware, (req, res) => StudentClass.accept_complaint(req, res));
router.post("/api/rejectComplaint", jwt_middleware, student_middlware, (req, res) => StudentClass.reject_complaint(req, res));

module.exports = router;