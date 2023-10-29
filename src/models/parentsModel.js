const mongoose = require('mongoose');

// Define the schema
const parentsSchema = new mongoose.Schema({
        email: { type: String, required: true },
        password: { type: String, required: true },
        mobileno: { type: String, required: true },
        name: { type: String, required: true }
    },
    {
        timestamps: true
    }
);

// Create the model
const Parents = mongoose.model('parent', parentsSchema);

module.exports = Parents;