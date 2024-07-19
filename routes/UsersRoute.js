'use strict';
const express = require('express');
const session = require('express-session');
const controller = require('../controllers/user.controller');
const authenticateUser = require('../authMiddleware/auth');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const multer = require('multer');
require('dotenv').config()

const router = express.Router();
router.use(bodyParser.urlencoded({
    extended: false
}));

router.use(bodyParser.json());
router.use(cookieParser());
router.use(session({
    secret: 'SECRETKEY',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

router.get('/', authenticateUser, controller.getAllUsers)

router.get('/active', authenticateUser, controller.getAllLoggedInUsers)

router.post("/register", controller.registerUser)

router.post("/login", controller.logInUser);

router.post("/refresh", controller.refreshUser);

router.post('/logout', controller.logOutUser);

router.delete('/delete', authenticateUser, controller.deleteUser);

router.put('/update', authenticateUser, controller.updateUserProfile);

router.post('/add-note', authenticateUser, controller.addNote);

router.post('/notes', authenticateUser, controller.getUserNotes);

router.post('/edit-note', controller.updateNoteById);

router.post('/delete-note', controller.deleteNoteById);

const storage = multer.diskStorage({
    destination(req, file, callback) {
        if (file.fieldname === "profileImage") {
            callback(null, './public/images');
        } else {
            callback(null, './public/banners');
        }
    },
    filename(req, file, callback) {
        callback(null, `${file.originalname}`);
    },
});

const upload = multer({ storage });

router.post('/profile-image', upload.any(), controller.updateProfileImage);

module.exports = router;