const express = require("express");
const router = express.Router();
const student_controller = require("../controllers/studentController");

const StudentClass = new student_controller();

router.get("/dashboard", (req, res) => StudentClass.load_student_dashboard_page(req, res));
router.get("/bookHostel", (req, res) => StudentClass.load_book_hostel_page(req, res));

module.exports = router;