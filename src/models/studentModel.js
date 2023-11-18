const mongoose = require('mongoose');

// Define the schema
const studentSchema = new mongoose.Schema({
        email: { type: String, required: true },
        password: { type: String, required: true },
        firstname: { type: String, required: true },
        lastname: { type: String, required: true },
        rollno: { type: String, required: true },
        mobileno: { type: String, required: true },
        parentsname: { type: String, required: true },
        parentsemail: { type: String, required: true },
        parentsmobile: { type: String, required: true },
        address: { type: String, required: true },
        status: { type: String, enum: ['true', 'false', 'passout', 'block'], default: false },
        proof: [{ type: String }],
        profile: { type: String },
        enrolled: { type: String, enum: ['true', 'false'], default: false },
        parentsid: { type: mongoose.Schema.Types.ObjectId },
        onLeave: { type: String, enum: ['true', 'false'], default: false }
    },
    {
        timestamps: true
    }
);

// Create the model
const Student = mongoose.model('student', studentSchema);

module.exports = Student;
