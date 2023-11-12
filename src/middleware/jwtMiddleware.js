const jwt = require("jsonwebtoken");
require('dotenv').config();

module.exports = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            const headingMessage = "Forbidden. Cannot access resource!";
            const paragraphMessage = "Please Try to login!";
            const newRoute = '/user/login';
            res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        // Attach the decoded token payload to the request object
        req.user = decoded;
        next();
    } catch (err) {
        const headingMessage = "Authentication failed!";
        const paragraphMessage = "Please Try to login!";
        const newRoute = '/user/login';
        res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
    }
};