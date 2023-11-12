module.exports = (roles) => {
    return (req, res, next) => {
        try {
            const token = req.user;
            if (roles.includes(token.role)) {
                next();
            } else {
                const headingMessage = "Authentication failed!";
                const paragraphMessage = "You cannot access these resources! Try to login with correct credentials.";
                const newRoute = '/user/login';
                res.render('utilities/responseMessageError.ejs', { headingMessage, paragraphMessage, newRoute });
            }
        } catch (error) {
            const headingMessage = "Authentication failed!";
            const paragraphMessage = "Please Try to log in!";
            const newRoute = '/user/login';
            res.render('utilities/responseMessageError.ejs', { headingMessage, paragraphMessage, newRoute });
        }
    };
};
