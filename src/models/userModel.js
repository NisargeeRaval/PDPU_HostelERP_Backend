const mongoose = require('mongoose');

// Define the schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    rollno: { type: String, required: true },
    mobileno: { type: String, required: true },
    parentsmobile: { type: String, required: true },
    address: { type: String, required: true }
});

// Create the model
const User = mongoose.model('User', userSchema);

module.exports = User;
