const express = require("express");
const router = express.Router();
const hostel_controller = require("../controllers/hostelController");
const multer = require('multer');
const path = require('path');
const jwt_middleware = require('../middleware/jwtMiddleware');
const admin_middlware = require('../middleware/adminMiddleware');
const multi_role_based_middleware = require('../middleware/multiRoleBasedMiddleware');

const HostelClass = new hostel_controller();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'public', 'images', 'hostel')); // Set the destination folder for uploaded files
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

router.get("/viewHostel", jwt_middleware, admin_middlware, (req, res) => HostelClass.load_hostel_detail_page(req, res));
router.get("/createHostel", jwt_middleware, admin_middlware, (req, res) => HostelClass.load_add_hostel__page(req, res));
router.post("/api/create", jwt_middleware, admin_middlware, upload.array("hostelPhotos"), (req, res) => HostelClass.add_hostel(req, res));
router.post("/api/update", jwt_middleware, admin_middlware, upload.array("hostelPhotos"), (req, res) => HostelClass.update_hostel(req, res));

const admin_warden_student = ['admin', 'warden'];
router.get("/hostelLayout", jwt_middleware, multi_role_based_middleware(admin_warden_student), (req, res) => HostelClass.load_hostel_layout_page(req, res));
router.get("/roomDetails", jwt_middleware, multi_role_based_middleware(admin_warden_student), (req, res) => HostelClass.load_room_detail_page(req, res));
router.post("/api/cancelBooking", jwt_middleware, multi_role_based_middleware(admin_warden_student), (req, res) => HostelClass.cancel_hostel_booking(req, res));

module.exports = router;