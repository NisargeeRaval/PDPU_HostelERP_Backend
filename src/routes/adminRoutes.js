const express = require("express");
const router = express.Router();
const admin_controller = require("../controllers/adminController");
const multer = require('multer');
const path = require('path');
const jwt_middleware = require('../middleware/jwtMiddleware');
const admin_middlware = require('../middleware/adminMiddleware');
const multi_role_based_middleware = require('../middleware/multiRoleBasedMiddleware');

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

const adminStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'public', 'images', 'admin')); // Set the destination folder for uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, (Date.now() + file.originalname).replace(/\s+/g, "")); // Set a unique filename for the uploaded file
    }
});

const adminUpload = multer({
    storage: adminStorage,
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

const studentFileUpload = upload.fields([
    { name: "profile", maxCount: 1 },
    { name: "proof", maxCount: 10 }
]);

router.post("/api/register", adminUpload.single("adminPhoto"), (req, res) => AdminClass.register(req, res));
router.get("/dashboard", jwt_middleware, admin_middlware, (req, res) => AdminClass.load_dashboard_page(req, res));
router.get("/verifyStudent", jwt_middleware, admin_middlware, (req, res) => AdminClass.load_verify_student_page(req, res));
router.post("/api/verifyStudent", jwt_middleware, admin_middlware, (req, res) => AdminClass.verify_student(req, res));

const admin_warden_student = ['admin', 'warden', 'student'];
router.get("/viewStudent", jwt_middleware, multi_role_based_middleware(admin_warden_student), (req, res) => AdminClass.load_view_student_page(req, res));
router.get("/api/searchStudent", jwt_middleware, multi_role_based_middleware(admin_warden_student), (req, res) => AdminClass.search_student(req, res));

//move this to student routes and give student middleware
router.get("/userUpdateDetails", (req, res) => AdminClass.load_update_student_details_page(req, res));
router.post("/api/userUpdateDetails", studentFileUpload, (req, res) => AdminClass.update_student_details(req, res));

router.get('/profile', jwt_middleware, admin_middlware, (req, res) => AdminClass.load_profile_page(req, res));
router.post('/updateProfile', jwt_middleware, admin_middlware, (req, res) => AdminClass.update_profile(req, res));
router.post('/api/resetHostel', jwt_middleware, admin_middlware, (req, res) => AdminClass.reset_hostel(req, res));

module.exports = router;