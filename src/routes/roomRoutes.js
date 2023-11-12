const express = require("express");
const router = express.Router();
const room_controller = require("../controllers/roomController");
const jwt_middleware = require('../middleware/jwtMiddleware');
const student_middlware = require('../middleware/studentMiddleware');

const RoomClass = new room_controller();

router.post("/api/bookHostel", jwt_middleware, student_middlware, (req, res) => RoomClass.book_hostel(req, res));

module.exports = router;