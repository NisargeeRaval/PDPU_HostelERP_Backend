var mongoose = require("mongoose");
require('dotenv').config();

mongoose.set("strictQuery", true);

const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("DB: Connected");
    } catch (error) {
        console.error("DB: Error", error);
    }
};

module.exports = connectToDatabase;
