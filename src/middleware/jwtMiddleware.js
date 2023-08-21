const jwt = require("jsonwebtoken");
require('dotenv').config();

module.exports = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization) {
            token = req.headers.authorization.split(" ")[0];
            const decoded = await jwt.verify(token, process.env.JWT_SECRET_KEY);
            req.userData = decoded;
            next();
        } else {
            return res.status(403).json({ message: 'Forbidden Token Not Found Try to login and get Token First' });
        }
    } catch (err) {
        return res.status(401).json({
            message: "Auth fail"
        });
    }
};