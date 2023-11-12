const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  hostel: { type: mongoose.Schema.Types.ObjectId, required: true },
  present: [{ type: mongoose.Schema.Types.ObjectId }],
  absent: [{ type: mongoose.Schema.Types.ObjectId }],
  leave: [{ type: mongoose.Schema.Types.ObjectId }],
});

// Add pre-save middleware to check the date before saving
attendanceSchema.pre('save', function (next) {
  // Get the current date
  const currentDate = new Date();

  // Check if the attendance date is in the past
  if (this.date < currentDate) {
    return next(new Error('Cannot take attendance for past dates.'));
  }

  next();
});

// Create the Attendance model
const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
