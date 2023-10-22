const express = require("express");
const router = express.Router();
const WardenClass = new (require('../controllers/wardenController'))();
const multer = require('multer');
const path = require('path');

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
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error("Please upload a valid image file"));
        }
        cb(null, true);
    }
});

router.get("/add", (req, res) => WardenClass.load_add_warden_page(req, res));
router.get("/view", (req, res) => WardenClass.load_view_warden_page(req, res));
router.post("/api/register", upload.single("wardenPhoto"), (req, res) => WardenClass.register_warden(req, res));
router.post("/api/update", upload.single("wardenPhoto"), (req, res) => WardenClass.update_warden(req, res));

module.exports = router;