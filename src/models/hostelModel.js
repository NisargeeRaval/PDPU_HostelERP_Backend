const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
    hostelName: { type: String, required: true },
    hostelPhotos: [{ type: String }],
    totalFloors: { type: Number, required: true },
    roomsPerFloor: { type: Number, required: true },
    occupancyPerRoom: { type: Number, required: true },
    hostelAddress: { type: String, required: true },
    rulesAndRegulations: { type: String },
    hostelType: { type: String, enum: ['male', 'female'], required: true },
    status: { type: String, enum: ['true', 'false'], default: false }
});

// Create the Hostel model
const Hostel = mongoose.model('Hostel', hostelSchema);

module.exports = Hostel;