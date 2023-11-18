const express = require("express");
const router = express.Router();
const WardenClass = new (require('../controllers/wardenController'))();
const multer = require('multer');
const path = require('path');
const jwt_middleware = require('../middleware/jwtMiddleware');
const admin_middlware = require('../middleware/adminMiddleware');
const warden_middlware = require('../middleware/wardenMiddleware');
const multi_role_based_middleware = require('../middleware/multiRoleBasedMiddleware');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'public', 'images', 'warden')); // Set the destination folder for uploaded files
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
        if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
            return cb(new Error("Please upload a valid image file"));
        }
        cb(null, true);
    }
});

router.get("/dashboard", jwt_middleware, warden_middlware, (req, res) => WardenClass.load_warden_dashboard_page(req, res));
router.get("/add", jwt_middleware, admin_middlware, (req, res) => WardenClass.load_add_warden_page(req, res));
router.get("/view", jwt_middleware, admin_middlware, (req, res) => WardenClass.load_view_warden_page(req, res));
router.post("/api/register", jwt_middleware, admin_middlware, upload.single("wardenPhoto"), (req, res) => WardenClass.register_warden(req, res));
router.post("/api/update", jwt_middleware, admin_middlware, upload.single("wardenPhoto"), (req, res) => WardenClass.update_warden(req, res));
router.get("/sendEmail", jwt_middleware, warden_middlware, (req, res) => WardenClass.load_send_email_page(req, res));
router.post("/api/sendEmail", jwt_middleware, warden_middlware, upload.array("attachments"), (req, res) => WardenClass.send_mail(req, res));
router.get('/profile', jwt_middleware, warden_middlware, (req, res) => WardenClass.load_profile_page(req, res));
router.post('/updateProfile', jwt_middleware, warden_middlware, (req, res) => WardenClass.update_profile(req, res));
router.get("/addExpense", jwt_middleware, warden_middlware, (req, res) => WardenClass.load_add_expense_page(req, res))
router.post("/api/addExpense", jwt_middleware, warden_middlware, (req, res) => WardenClass.add_expense(req, res));

const admin_warden = ['admin', 'warden'];
router.get("/logExpenses", jwt_middleware, multi_role_based_middleware(admin_warden), (req, res) => WardenClass.load_log_expenses(req, res))
router.get("/takeAttendance", jwt_middleware, warden_middlware, (req, res) => WardenClass.load_take_attendance_page(req, res))
module.exports = router;
