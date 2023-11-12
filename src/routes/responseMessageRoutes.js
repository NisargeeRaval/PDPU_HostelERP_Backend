const express = require("express");
const router = express.Router();
const responseMessage_controller = require("../utilities/renderResponseMessage");

const ResponseMessageClass = new responseMessage_controller();


router.get("/success", (req, res) => ResponseMessageClass.renderResponseMessageSuccess(req, res));
router.get("/error", (req, res) => ResponseMessageClass.renderResponseMessageError(req, res));

module.exports = router;