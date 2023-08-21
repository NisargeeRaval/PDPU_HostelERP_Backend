var mongoose = require("mongoose");
require('dotenv').config();

mongoose.set("strictQuery", true);

// Connect to DB
mongoose.connect(process.env.DATABASE_URL);

// Event handlers for database connection
const db = mongoose.connection;

db.on("error", (error) => {
    console.error("DB : Error", error);
});

db.once("open", () => {
    console.log("DB : Connected");
});

module.exports = mongoose;
