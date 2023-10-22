const express = require("express");
const router = express.Router();
const admin_controller = require("../controllers/adminController");

const AdminClass = new admin_controller();

router.post("/api/register", (req, res) => AdminClass.register(req, res));
router.get("/dashboard", (req, res) => AdminClass.load_dashboard_page(req, res));
router.get("/verifyStudent", (req, res) => AdminClass.load_verify_student_page(req, res));
router.post("/api/verifyStudent", (req, res) => AdminClass.verify_student(req, res));

module.exports = router;