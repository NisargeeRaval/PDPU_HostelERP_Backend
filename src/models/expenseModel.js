const mongoose = require('mongoose');

// Define Expense Schema with timestamps
const expenseSchema = new mongoose.Schema({
    hostel: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    warden: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    expenseAmount: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true
    }
}, {
    timestamps: true // Add timestamps
});

// Create Expense Model
const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
