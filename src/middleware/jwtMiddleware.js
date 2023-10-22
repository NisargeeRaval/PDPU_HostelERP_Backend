const jwt = require("jsonwebtoken");
require('dotenv').config();

module.exports = async (req, res, next) => {
    try {
        // Check if the token is provided in the request headers
        const tokenFromHeaders = req.headers.authorization;

        // Check if the token is provided in the URL query parameters
        const tokenFromQuery = req.query.token;

        // Check if the token is provided in the request body (form input)
        const tokenFromBody = req.body.token;

        // Combine tokens from all sources, removing undefined or empty values
        const allTokens = [tokenFromHeaders, tokenFromQuery, tokenFromBody].filter(Boolean);

        // Use the first non-empty token found, or undefined if none were provided
        const token = allTokens[0];

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