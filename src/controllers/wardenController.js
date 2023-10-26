const hostel_model = require('../models/hostelModel');
const warden_model = require('../models/wardenModel')
const update_path = require('../utilities/response_image_url');
const bcrypt = require('bcrypt');

module.exports = class Warden {
    constructor() {
        if (Warden.instance) {
            return Warden.instance; // Return the existing instance if it already exists
        }

        this.hostelData = null;
        this.wardenData = null;

        this.loadHostelData();
        this.loadWardenData();

        Warden.instance = this; // Store the instance
    }

    async loadHostelData() {
        try {
            this.hostelData = await hostel_model.find({}).select('_id hostelName');
        } catch (error) {
            console.error('Error while fetching hostel data:', error);
        }
    }

    async loadWardenData() {
        try {
            const result = await warden_model.aggregate([
                {
                    $lookup: {
                        from: 'hostels',
                        localField: 'hostel',
                        foreignField: '_id',
                        as: 'hostel'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        wardenName: 1,
                        wardenPhoto: 1,
                        mobile: 1,
                        email: 1,
                        status: 1,
                        'hostelName': { $arrayElemAt: ['$hostel.hostelName', 0] }
                    }
                }
            ]);

            for (let i = 0; i < result.length; i++) {
                result[i].wardenPhoto = await update_path("warden", result[i].wardenPhoto);
            }
            this.wardenData = result;
        } catch (error) {
            console.error('Error while fetching hostel data:', error);
        }
    }

    async load_add_warden_page(req, res) {
        try {
            return res.render('HTML/admin/addWarden.ejs', { hostel: this.hostelData, warden: this.wardenData });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while loading page. Reload the page again!";
            const newRoute = '/admin/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async load_view_warden_page(req, res) {
        try {
            return res.render('HTML/admin/viewWarden.ejs', { hostel: this.hostelData, warden: this.wardenData });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while loading page. Reload the page again!";
            const newRoute = '/admin/dashboard';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async register_warden(req, res) {
        try {
            const { wardenName, hostel, mobile, email, password } = req.body;

            // Check if a warden with the same email or mobile number already exists
            const existingWarden = await warden_model.findOne({
                $or: [{ email }, { mobile }],
            });

            if (existingWarden) {
                const headingMessage = "Data Duplication!";
                const paragraphMessage = "Warden already exist!";
                const newRoute = '/warden/add';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create a new warden instance
            const newWarden = new warden_model({
                wardenName,
                hostel,
                mobile,
                email,
                password: hashedPassword,
                wardenPhoto: req.file.filename,
                status: 'true'
            });

            // Save the warden to the database
            await newWarden.save();

            // Reload the warden data
            await this.loadWardenData();

            return res.render('HTML/admin/viewWarden.ejs', { hostel: this.hostelData, warden: this.wardenData });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while registering warden. Register warden again!";
            const newRoute = '/warden/add';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }

    async update_warden(req, res) {
        try {
            const { wardenName, hostel, mobile, email, status } = req.body;

            const warden_id = req.query.id;

            const warden = await warden_model.findById(warden_id);

            if (!warden) {
                const headingMessage = "Something went wrong";
                const paragraphMessage = "Error while updating warden. Warden not found. Try to add warden!";
                const newRoute = '/warden/add';
                return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
            }

            const updateWarden = {
                wardenName,
                hostel,
                mobile,
                email,
                status
            }

            if (req.file) {
                updateWarden.wardenPhoto = req.file.filename;
            }

            await warden_model.findByIdAndUpdate(warden_id, updateWarden);

            // Reload the warden data
            await this.loadWardenData();

            const headingMessage = "Warden Successfully Updated!";
            const paragraphMessage = `Click "OK" to view the updated warden details!`;
            const newRoute = '/warden/view'; // Redirect to the appropriate route
            return res.render('utilities/responseMessageSuccess.ejs', {
                headingMessage: headingMessage,
                paragraphMessage: paragraphMessage,
                newRoute: newRoute,
            });
        } catch (error) {
            const headingMessage = "Something went wrong";
            const paragraphMessage = "Error while updating warden. Update warden details again!";
            const newRoute = '/warden/view';
            return res.render('utilities/responseMessageError.ejs', { headingMessage: headingMessage, paragraphMessage: paragraphMessage, newRoute: newRoute });
        }
    }
};