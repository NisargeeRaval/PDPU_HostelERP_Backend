const mongoose = require('mongoose');

// Define the schema
const studentSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    rollno: { type: String, required: true },
    mobileno: { type: String, required: true },
    parentsmobile: { type: String, required: true },
    address: { type: String, required: true },
    status: { type: String, enum: ['true', 'false', 'passout'], default: false },
    proof: [{ type: String }]
});

// Create the model
const Student = mongoose.model('student', studentSchema);

module.exports = Student;
