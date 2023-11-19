const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: { type: String, required: true },
  hostel: { type: mongoose.Schema.Types.ObjectId, required: true },
  present: [{ type: mongoose.Schema.Types.ObjectId }],
  absent: [{ type: mongoose.Schema.Types.ObjectId }],
  leave: [{ type: mongoose.Schema.Types.ObjectId }],
});

// Create the Attendance model
const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
