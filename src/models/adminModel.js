const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
    {
        email: { type: String, required: true },
        password: { type: String, required: true },
        phone: { type: String, required: true }
    },
    {
        timestamps: true
    }
);

// Create the Admin model
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;