const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectToDatabase = require('./src/config/mongoDB');
const logApi = require('./src/middleware/logAPIMiddleware');
require('dotenv').config();
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'src/public')));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set the base directory for views
app.set('views', path.join(__dirname, 'src/public/views'));

// custome middleware
app.use(logApi);

const userRoutes = require('./src/routes/userRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const hostelRoutes = require('./src/routes/hostelRoutes');
const wardenRoutes = require('./src/routes/wardenRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const roomRoutes = require('./src/routes/roomRoutes');
const parentsRoutes = require('./src/routes/parentsRoutes');
const responseMessageRoutes = require('./src/routes/responseMessageRoutes');

// Your routes go here
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/hostel', hostelRoutes);
app.use('/warden', wardenRoutes);
app.use('/student', studentRoutes);
app.use('/room', roomRoutes);
app.use('/parents', parentsRoutes);
app.use('/response', responseMessageRoutes);

// Connect to MongoDB and then start the server
connectToDatabase().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is listening on port ${process.env.PORT}`);
    });
});