const express = require("express");
const router = express.Router();
const user_controller = require("../controllers/userController");

const UserClass = new user_controller();

router.get("/login", (req, res) => UserClass.load_login_page(req, res))
router.post("/api/login", (req, res) => UserClass.login(req, res));
router.get("/register", (req, res) => UserClass.load_register_page(req, res));
router.post("/api/register", (req, res) => UserClass.register(req, res));

module.exports = router;