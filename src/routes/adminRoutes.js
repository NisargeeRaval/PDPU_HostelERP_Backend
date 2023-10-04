const express = require("express");
const router = express.Router();
const admin_controller = require("../controllers/adminController");

const AdminClass = new admin_controller();

router.post("/api/register", (req, res) => AdminClass.register(req, res));
router.get("/dashboard", (req, res) => AdminClass.load_dashboard_page(req, res));
router.get("/warden", (req, res) => AdminClass.load_warden_page(req, res));

module.exports = router;