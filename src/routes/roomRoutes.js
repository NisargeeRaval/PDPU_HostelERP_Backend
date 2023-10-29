const express = require("express");
const router = express.Router();
const room_controller = require("../controllers/roomController");

const RoomClass = new room_controller();

router.post("/api/bookHostel", (req, res) => RoomClass.book_hostel(req, res));

module.exports = router;