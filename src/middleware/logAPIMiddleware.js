module.exports = async (req, res, next) => {
    console.log(`Request: ${req.method} ${req.originalUrl}`);
    next();
};