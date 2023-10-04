const express = require("express");
const router = express.Router();
const hostel_controller = require("../controllers/hostelController");
const multer = require('multer');
const path = require('path');
const jwt_middleware = require('../middleware/jwtMiddleware');

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

router.get("/viewHostel", jwt_middleware, (req, res) => HostelClass.load_hostel_detail_page(req, res));
router.get("/createHostel", (req, res) => HostelClass.load_add_hostel__page(req, res));
router.post("/api/create", upload.array("hostelPhotos"), (req, res) => HostelClass.add_hostel(req, res));
router.post("/api/update", upload.array("hostelPhotos"), (req, res) => HostelClass.update_hostel(req, res));

module.exports = router;