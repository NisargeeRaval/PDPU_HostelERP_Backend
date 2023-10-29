const hostel_model = require('../models/hostelModel');
const room_model = require('../models/roomModel');
const room_controller = require("../controllers/roomController");
const update_path = require('../utilities/response_image_url');
const { default: mongoose } = require('mongoose');
const RoomClass = new room_controller();

module.exports = class Hostel {
    async load_hostel_detail_page(req, res) {
        try {
            // Retrieve the token (you should get it from wherever it's stored)
            const token = req.query.token || req.body.token || req.headers.authorization;

            const hostelData = await hostel_model.find({});

            return res.render('HTML/admin/viewHostel.ejs', { hostelData: hostelData, token: token });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Please Try to reload the page!";
            const newRoute = '/hostel/viewHostel';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_add_hostel__page(req, res) {
        try {
            return res.render('HTML/admin/addHostel.ejs');
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while fetching data. Reload the page again!";
            const newRoute = '/admin/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async add_hostel(req, res) {
        try {
            const { hostelName, totalFloors, roomsPerFloor, occupancyPerRoom, hostelAddress, rulesAndRegulations, hostelType } = req.body;

            const hostel = new hostel_model({
                hostelName,
                totalFloors,
                roomsPerFloor,
                occupancyPerRoom,
                hostelAddress,
                rulesAndRegulations,
                hostelType,
                hostelPhotos: req.files.map((file) => file.filename)
            });

            const result = await hostel.save();

            if (result) {
                let rooms = [];

                for (var i = 0; i <= totalFloors; i++) {
                    for (var j = 1; j <= roomsPerFloor; j++) {
                        let roomNumber = (i * 100) + j;
                        if (roomNumber < 10) {
                            roomNumber = '00' + ((i * 100) + j);
                        } else if (roomNumber >= 10 && roomNumber <= 99) {
                            roomNumber = '0' + ((i * 100) + j);
                        } else {
                            roomNumber = roomNumber;
                        }

                        const newRoom = {
                            hostelID: result._id,
                            roomNumber: roomNumber
                        }
                        rooms.push(newRoom);
                    }
                }

                await room_model.insertMany(rooms);
            }

            const headingMessage = "Hostel Succesfully Created!";
            const paragraphMessage = `Click "OK" to view hostel details!`;
            const newRoute = '/hostel/viewHostel';
            return res.render('utilities/responseMessageSuccess.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while creating hostel. Try to create hostel again!";
            const newRoute = '/hostel/createHostel';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async update_hostel(req, res) {
        try {
            const hostelId = req.query.id; // Assuming you pass the hostel ID in the URL

            const {
                hostelName,
                totalFloors,
                roomsPerFloor,
                occupancyPerRoom,
                hostelAddress,
                rulesAndRegulations,
                hostelType,
                status,
                enrollmentActivity
            } = req.body;

            // Create an object with the updated data
            const updatedHostel = {
                hostelName,
                totalFloors,
                roomsPerFloor,
                occupancyPerRoom,
                hostelAddress,
                rulesAndRegulations,
                hostelType,
                status,
                enrollmentActivity
            };

            // Check if photos were uploaded
            if (req.files && req.files.length > 0) {
                updatedHostel.hostelPhotos = req.files.map((file) => file.filename);
            }

            // Use findByIdAndUpdate to update the hostel
            const result = await hostel_model.findByIdAndUpdate(hostelId, updatedHostel, { new: true });

            console.log(result);

            const headingMessage = "Hostel Successfully Updated!";
            const paragraphMessage = `Click "OK" to view the updated hostel details!`;
            const newRoute = '/hostel/viewHostel'; // Redirect to the appropriate route
            return res.render('utilities/responseMessageSuccess.ejs', {
                headingMessage: headingMessage,
                paragraphMessage: paragraphMessage,
                newRoute: newRoute,
            });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while updating hostel. Try again!";
            const newRoute = '/hostel/viewHostel'; // Redirect to the appropriate route
            return res.render('utilities/responseMessageError.ejs', {
                headingMessage: headingMessage,
                paragraphMessage: paragraphMessage,
                newRoute: newRoute,
            });
        }
    }

    async load_hostel_layout_page(req, res) {
        try {
            const hostelID = req.query.hostelID;

            const hostel = await hostel_model.findById(hostelID);

            const hostelLayout = await RoomClass.hostel_layout(hostelID);

            return res.render('HTML/hostel/hostelLayout.ejs', { hostelLayout: hostelLayout, hostelName: hostel.hostelName });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Please Try to reload the page!";
            const newRoute = '/hostel/viewHostel';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_room_detail_page(req, res) {
        try {
            const roomID = new mongoose.Types.ObjectId(req.query.roomID);

            const roomDetails = await room_model.aggregate([
                {
                    $match: { _id: roomID }
                },
                {
                    $lookup: {
                        from: 'students',
                        localField: 'user',
                        foreignField: '_id',
                        as: 'user'
                    }
                }
            ]);

            for(var i = 0; i < roomDetails[0].user.length; i++) {
                for(var j = 0; j < roomDetails[0].user[i].proof.length; j++) {
                    roomDetails[0].user[i].proof[j] = await update_path('student', roomDetails[0].user[i].proof[j]);
                    console.log(roomDetails[0].user[i].proof[j]);
                }
            }

            return res.render('HTML/hostel/roomDetails.ejs', { roomDetails: roomDetails });
        } catch (error) {
            console.log(error);
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Please Try to reload the page!";
            const newRoute = '/hostel/viewHostel';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }
};