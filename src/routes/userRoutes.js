const express = require("express");
const router = express.Router();
const user_controller = require("../controllers/userController");

const UserClass = new user_controller();

router.get("/", (req, res) => UserClass.base_url(req, res));
router.post("/login", (req, res) => UserClass.login(req, res));
router.post("/register", (req, res) => UserClass.register(req, res));

module.exports = router;