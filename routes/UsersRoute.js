'use strict';
const express = require('express');
const session = require('express-session');
const controller = require('../controllers/user.controller');
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

router.get('/', controller.getAllUsers)

router.get('/active', controller.getAllLoggedInUsers)

router.post("/register", controller.registerUser)

router.post("/login", controller.logInUser);

router.post('/logout', controller.logOutUser);

router.put('/update', controller.updateUserProfile);

router.put('/add-note', controller.addNote);

router.post('/notes', controller.getUserNotes);

router.put('/edit-note', controller.updateNoteById);

router.post('/delete-note', controller.deleteNoteById);

const storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, '../public/images');
    },
    filename(req, file, callback) {
        callback(null, `${file.originalname}`);
    },
});
const upload = multer({ storage });

router.post('/profile-image', upload.single('photo'), (req, res) => {
    res.status(200).json({ success: true });
});

module.exports = router;