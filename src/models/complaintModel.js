const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
    {
        subject: { type: String, required: true },
        description: { type: String, required: true },
        student: { type: mongoose.Schema.Types.ObjectId, required: true },
        hostel: { type: mongoose.Schema.Types.ObjectId, required: true },
        warden: { type: mongoose.Schema.Types.ObjectId },
        solved: { type: String, enum: ['true', 'false'], default: false },
    },
    {
        timestamps: true
    }
);

// Create the Complaint model
const Complaint = mongoose.model('complaint', complaintSchema);

module.exports = Complaint;