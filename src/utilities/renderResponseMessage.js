module.exports = class RenderResponseMessage {
    async renderResponseMessageError(req, res) {
        const { headingMessage, paragraphMessage, newRoute } = req.query;
        return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
    }

    async renderResponseMessageSuccess(req, res) {
        const { headingMessage, paragraphMessage, newRoute } = req.query;
        return res.render('utilities/responseMessageSuccess.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
    }
}