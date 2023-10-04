const hostel_model = require('../models/hostelModel');

module.exports = class Admin {
    async load_hostel_detail_page(req, res) {
        try {
            // Retrieve the token (you should get it from wherever it's stored)
            const token = req.query.token || req.body.token || req.headers.authorization;

            const hostelData = await hostel_model.find({});

            res.render('HTML/admin/viewHostel.ejs', { hostelData: hostelData, token: token });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Please Try to reload the page!";
            const newRoute = '/hostel/viewHostel';
            res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_add_hostel__page(req, res) {
        res.render('HTML/admin/addHostel.ejs');
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

            await hostel.save();

            const headingMessage = "Hostel Succesfully Created!";
            const paragraphMessage = `Click "OK" to view hostel details!`;
            const newRoute = '/hostel/viewHostel';
            res.render('utilities/responseMessageSuccess.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while creating hostel. Try to create hostel again!";
            const newRoute = '/hostel/createHostel';
            res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async update_hostel(req, res) {
        try {
            const hostelId = req.query.id; // Assuming you pass the hostel ID in the URL
            console.log(hostelId);
            const {
                hostelName,
                totalFloors,
                roomsPerFloor,
                occupancyPerRoom,
                hostelAddress,
                rulesAndRegulations,
                hostelType,
                status
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
                status
            };

            // Check if photos were uploaded
            if (req.files && req.files.length > 0) {
                updatedHostel.hostelPhotos = req.files.map((file) => file.filename);
            }

            // Use findByIdAndUpdate to update the hostel
            await hostel_model.findByIdAndUpdate(hostelId, updatedHostel);

            const headingMessage = "Hostel Successfully Updated!";
            const paragraphMessage = `Click "OK" to view the updated hostel details!`;
            const newRoute = '/hostel/viewHostel'; // Redirect to the appropriate route
            res.render('utilities/responseMessageSuccess.ejs', {
                headingMessage: headingMessage,
                paragraphMessage: paragraphMessage,
                newRoute: newRoute,
            });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while updating hostel. Try again!";
            const newRoute = '/hostel/viewHostel'; // Redirect to the appropriate route
            res.render('utilities/responseMessageError.ejs', {
                headingMessage: headingMessage,
                paragraphMessage: paragraphMessage,
                newRoute: newRoute,
            });
        }
    }
};