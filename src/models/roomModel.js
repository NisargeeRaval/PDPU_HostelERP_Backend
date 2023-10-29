const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
    {
        hostelID: { type: mongoose.Schema.Types.ObjectId, required: true },
        roomNumber: { type: String, required: true },
        user: [{ type: mongoose.Schema.Types.ObjectId }]
    },
    {
        timestamps: true
    }
);

const Room = mongoose.model('room', roomSchema);

module.exports = Room;