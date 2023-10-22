const mongoose = require('mongoose');

const wardenSchema = new mongoose.Schema({
    wardenName: {
        type: String,
        required: true,
    },
    wardenPhoto: {
        type: String,
        required: true,
    },
    hostel: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['true', 'false'],
        required: true,
    },
});

const Warden = mongoose.model('Warden', wardenSchema);

module.exports = Warden;