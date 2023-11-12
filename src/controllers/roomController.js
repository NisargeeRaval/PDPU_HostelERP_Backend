const room_model = require('../models/roomModel');
const hostel_model = require('../models/hostelModel');
const student_model = require('../models/studentModel');

module.exports = class Room {
    async hostel_layout(hostelID) {
        try {
            const hostel = await hostel_model.findById(hostelID);
            const occupancyPerRoom = hostel.occupancyPerRoom;

            const rooms = await room_model.find({ hostelID: hostelID });

            let hostelLayout = [];

            for (var i = 0; i < rooms.length; i++) {
                const room = rooms[i].toObject();
                const floor = await this.find_floor_number(room.roomNumber);

                // Check if the floor already exists in hostelLayout
                const floorIndex = hostelLayout.findIndex(item => item.floor === floor);

                if (floorIndex === -1) {
                    // If the floor doesn't exist, add it with an array containing the room
                    const floorVacantSeats = await this.find_room_vacancy(room, occupancyPerRoom);
                    const floorFilledSeats = room.user.length;
                    room.vacencyPerRoom = floorVacantSeats;
                    room.filledPerRoom = occupancyPerRoom - floorVacantSeats;
                    hostelLayout.push({ floor, floorVacantSeats, floorFilledSeats, rooms: [room] });
                } else {
                    // If the floor exists, push the room to the existing floor's array
                    const roomVacency = await this.find_room_vacancy(room, occupancyPerRoom);
                    const floorVacantSeats = hostelLayout[floorIndex].floorVacantSeats + roomVacency;
                    const floorFilledSeats = hostelLayout[floorIndex].floorFilledSeats + room.user.length;
                    hostelLayout[floorIndex].floorVacantSeats = floorVacantSeats;
                    hostelLayout[floorIndex].floorFilledSeats = floorFilledSeats;
                    // Determine the index of the room within the array
                    const roomIndex = hostelLayout[floorIndex].rooms.findIndex(item => item._id === room._id);

                    if (roomIndex === -1) {
                        // If the room is not found in the array, add it
                        room.vacencyPerRoom = roomVacency;
                        room.filledPerRoom = occupancyPerRoom - roomVacency;
                        hostelLayout[floorIndex].rooms.push(room);
                    } else {
                        // If the room exists in the array, update its properties
                        hostelLayout[floorIndex].rooms[roomIndex].vacencyPerRoom = roomVacency;
                        hostelLayout[floorIndex].rooms[roomIndex].filledPerRoom = occupancyPerRoom - roomVacency;
                    }
                }
            }

            return hostelLayout;
        } catch (error) {
            console.log(error);
        }
    }

    async find_floor_number(roomNumber) {
        const floorNumber = Math.floor(roomNumber / 100);
        return floorNumber;
    }

    async find_room_vacancy(room, occupancyPerRoom) {
        const roomUsers = room.user.length;
        return (occupancyPerRoom - roomUsers);
    }

    async get_hostel_data_for_booking() {
        try {
            const hostels = await hostel_model.find({ enrollmentActivity: 'true', status: 'true' });

            const hostelDataForBooking = [];

            for (const hostel of hostels) {
                const hostelLayout = await this.hostel_layout(hostel._id);

                const availableFloors = [];
                const availableRooms = [];

                for (let floor = 0; floor < hostelLayout.length; floor++) {
                    if (hostelLayout[floor].floorVacantSeats > 0) {
                        availableFloors.push(floor);

                        for (let room = 0; room < hostelLayout[floor].rooms.length; room++) {
                            if (hostelLayout[floor].rooms[room].vacencyPerRoom > 0) {
                                availableRooms.push(hostelLayout[floor].rooms[room]);
                            }
                        }
                    }
                }

                if (availableFloors.length > 0) {
                    hostelDataForBooking.push({
                        hostel: hostel,
                        floorData: availableFloors,
                        availableRooms: availableRooms,
                    });
                }
            }
            return hostelDataForBooking;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async book_hostel(req, res) {
        try {
            const { hostelSelect, roomSelect } = req.body;

            const userID = req.user._id;

            const student = await student_model.findById(userID);

            if (student.enrolled == 'true') {
                const headingMessage = "Can not book Room";
                const paragraphMessage = "You can not book room!You already have one booked room. Cancle your current booked room to avail new room.";
                const newRoute = '/student/dashboard';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            const room = await room_model.findOne({ hostelID: hostelSelect, _id: roomSelect });

            if (!room) {
                const headingMessage = "Room not found";
                const paragraphMessage = "Select room not found! Try to choose another room";
                const newRoute = '/student/bookHostel';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            room.user = userID;
            await room.save();

            student.enrolled = 'true';
            await student.save();

            const headingMessage = "Room Booked!";
            const paragraphMessage = "Select room booked succesfully! Please pay room fees.";
            const newRoute = '/student/dashboard';
            return res.render('utilities/responseMessageSuccess.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while booking hostel. Try to book hostel again!";
            const newRoute = '/student/bookHostel';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }
}