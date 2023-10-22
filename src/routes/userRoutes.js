const express = require("express");
const router = express.Router();
const user_controller = require("../controllers/userController");
const multer = require('multer');
const path = require('path');

const UserClass = new user_controller();

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

router.get("/login", (req, res) => UserClass.load_login_page(req, res))
router.post("/api/login", (req, res) => UserClass.login(req, res));
router.get("/register", (req, res) => UserClass.load_register_page(req, res));
router.post("/api/register", upload.array("studentPhotos"), (req, res) => UserClass.register(req, res));

module.exports = router;