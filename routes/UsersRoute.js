'use strict';
const express = require('express');
const session = require('express-session');
const repository = require('../repositories/UserRepository');
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

router.post("/register", (req, res) => {
    let user = req.body.user;
    repository.registerUser(user, res)
})

router.post('/login', function (req, res) {
    let user = req.body.user;
    repository.logInUser(user, res)
});

router.post('/logout', function (req, res) {
    let user = req.body.user;
    repository.logOutUser(user, res)
});

router.put('/update', function (req, res) {
    let user = req.body.user;
    let newStuff = req.body.newStuff
    repository.updateUser(user, newStuff, res)
});

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