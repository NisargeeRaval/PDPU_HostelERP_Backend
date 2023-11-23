const express = require("express");
const router = express.Router();
const parents_controller = require("../controllers/parentsController");
const jwt_middleware = require('../middleware/jwtMiddleware');
const parents_middlware = require('../middleware/parentMiddleware');

const ParentsClass = new parents_controller();


router.get("/dashboard", jwt_middleware, parents_middlware, (req, res) => ParentsClass.load_dashboard_page(req, res));
router.get("/profile", jwt_middleware, parents_middlware, (req, res) => ParentsClass.load_profile_page(req, res));

module.exports = router;