require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const connectToDatabase = require('../config/mongoDB');
const cron = require('node-cron');
const attendance_model = require('../models/attendanceModel');
const hostel_model = require('../models/hostelModel');
const room_model = require('../models/roomModel');
const student_model = require('../models/studentModel');
const getFormatedDate = require('./getFormatedDate');

connectToDatabase()
  .then(() => {
    cron.schedule('0 20 * * *', async () => {
      console.log("------>creating attendance");
      try {
        const hostels = await hostel_model.find({});

        for (const hostel of hostels) {
          const hostelID = hostel._id;

          const currentDate = new Date();
          const finalDate = await getFormatedDate(currentDate);

          const existingAttendance = await attendance_model.findOne({ date: finalDate, hostel: hostelID });

          if (!existingAttendance) {
            const newAttendance = new attendance_model({
              date: finalDate,
              hostel: hostelID,
              present: [],
              absent: [],
              leave: []
            });
            const newAttendanceResult = await newAttendance.save();

            const rooms = await room_model.find({ hostelID: hostelID });

            for (const room of rooms) {
              const students = room.user;
              const studentDetails = await student_model.find({ _id: { $in: students } });

              for (const student of studentDetails) {
                if (student.onLeave === "true") {
                  newAttendanceResult.leave.push(student._id);
                } else {
                  newAttendanceResult.absent.push(student._id);
                }
              }
            }

            await newAttendanceResult.save();
          } else {
            console.log(`Attendance already created for ${hostel.hostelName} on ${existingAttendance.date}`);
            console.log(`Attendance already created for Hostel ${hostelID} on ${existingAttendance.date}`);
          }
        }

        console.log('Attendance check completed.');
      } catch (error) {
        console.error('Error occurred during attendance creation:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });
  })
  .catch((error) => {
    console.error('DB connection error:', error);
  });
