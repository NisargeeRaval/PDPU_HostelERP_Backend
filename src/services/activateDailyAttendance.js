const mongoose = require('mongoose');
const cron = require('node-cron');
const attendance_model = require('../models/attendanceModel');
const hostel_model = require('../models/hostelModel');
const room_model = require('../models/roomModel');
const student_model = require('../models/studentModel');

mongoose.connect('mongodb+srv://manavhce20:RKPhWgvW2Fhhc5kF@summerinternship2023.ywqkc4o.mongodb.net/PDPU_HostelERP?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

cron.schedule('39 1 * * *', async () => {
  console.log("------>creating attendance");
    try {
      const hostels = await hostel_model.find({});
    
      
      for (const hostel of hostels) {
        // const { _id: hostelID } = hostel;
        const hostelID = hostel._id;
  
        const attendance = await attendance_model.findOne({ date: new Date(), hostel: hostelID });
            
        let newAttendanceResult;

        if (!attendance) {
          const newAttendance = new attendance_model({
            date: new Date(),
            hostel: hostelID,
            present: [],
            absent: [],
            leave: []
          });
          newAttendanceResult = await newAttendance.save();
        }

        const rooms = await room_model.find({ hostelID : hostelID });
  
        for (const room of rooms) {
          const students = room.user;

          const studentDetails = await student_model.find({ _id: { $in: students } });
  
          for (const student of studentDetails) {
  
            if (student.onLeave == "true") {
              newAttendanceResult.leave.push(student._id);
            } else {
              newAttendanceResult.absent.push(student._id);
            }

            await newAttendanceResult.save();
          }
        }
      }
  
      console.log('Attendance documents created/updated successfully.');
    } catch (error) {
      console.error('Error occurred during attendance creation:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });