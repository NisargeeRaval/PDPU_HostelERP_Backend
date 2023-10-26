const express = require("express");
const router = express.Router();
const admin_controller = require("../controllers/adminController");
const multer = require('multer');
const path = require('path');

const AdminClass = new admin_controller();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'public', 'images', 'student')); // Set the destination folder for uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, (Date.now() + file.originalname).replace(/\s+/g, "")); // Set a unique filename for the uploaded file
    }
});

// Set the upload limits for files
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB file size limit
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error("Please upload a valid image file"));
        }
        cb(null, true);
    }
});

router.post("/api/register", (req, res) => AdminClass.register(req, res));
router.get("/dashboard", (req, res) => AdminClass.load_dashboard_page(req, res));
router.get("/verifyStudent", (req, res) => AdminClass.load_verify_student_page(req, res));
router.post("/api/verifyStudent", (req, res) => AdminClass.verify_student(req, res));
router.get("/viewStudent", (req, res) => AdminClass.load_view_student_page(req, res));
router.get("/api/searchStudent", (req, res) => AdminClass.search_student(req, res));
router.get("/userUpdateDetails", (req, res) => AdminClass.load_update_student_details_page(req, res));
router.post("/api/userUpdateDetails", upload.array("studentPhotos"), (req, res) => AdminClass.update_student_details(req, res));

module.exports = router;