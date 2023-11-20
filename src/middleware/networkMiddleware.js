require('dotenv').config();

module.exports = async (req, res, next) => {
    try {
        const allowedIP = '192.168.1.1'; // Define your allowed IP here

        const userIP = req.ip; // Fetch the user's IP address

        // Check if the user's IP matches the allowed IP
        if (userIP === allowedIP) {
            next(); // Allow access to the route
        } else {
            const headingMessage = "Authentication failed!";
            const paragraphMessage = "Please Try to login with PDEU network to access resources!";
            const newRoute = '/user/login';
            res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }

    } catch (err) {
        const headingMessage = "Authentication failed!";
        const paragraphMessage = "Please Try to login with PDEU network to access resources!";
        const newRoute = '/user/login';
        res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
    }
};