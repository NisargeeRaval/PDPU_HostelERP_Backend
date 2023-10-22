module.exports = async (req, res, next) => {
    try {
        const token = req.user;
        if (token.role == 'student') {
            next();
        } else {
            const headingMessage = "Authentication failed!";
            const paragraphMessage = "You cannot access these resources! Try to login with correct credentials.";
            const newRoute = '/user/login';
            res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    } catch (error) {
        const headingMessage = "Authentication failed!";
        const paragraphMessage = "Please Try to login!";
        const newRoute = '/user/login';
        res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
    }
}