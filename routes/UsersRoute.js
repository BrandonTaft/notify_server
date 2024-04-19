'use strict';
const express = require('express');
const session = require('express-session');
const repository = require('../repositories/UserRepository');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const salt = 10;
require('dotenv').config()

//********************* Middleware *********************//
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


//*********** Get All Notes ***********//
router.get('/notes', (req, res, next) => {
    repository.findAllNotes()
        .then((notes) => { res.json({ success: true, notes: notes }) })
        .catch((error) => console.log(error));
});

//************* Add Reminders **************//
// router.post('/', function (req, res, next) {
//     let newReminder = req.body;
//     repository.create(newReminder)
//         .then(res.status(200).json({ success: true }))
//         .catch((error) => console.log(error))
// });

//************* Add Notes **************//
router.post('/notes', function (req, res, next) {
    let note = req.body;
    repository.createNote(note)
        .then(res.status(200).json({ success: true }))
        .catch((error) => console.log(error))
});

//*********** Update Reminders *************//
// router.put('/', (req, res) => {
//     let reminder = req.body;
//     repository.updateById(reminder)
//         .then(res.status(200).json({ success: true }))
//         .catch((error) => console.log(error));
// });

//*********** Update Notes *************//
router.put('/notes', function (req, res, next) {
    const note = req.body;
    repository.updateNoteById(note)
        .then(res.status(200).json({ success: true }))
        .catch((error) => console.log(error));
});

//********** Restore Reminders and notes *************//
router.post('/restore', function (req, res, next) {
    const selected = req.body.selected
    repository.restoreSelected(selected)
        .then(() => { res.status(200).json({ success: true }) })
        .catch((error) => console.log(error))
});

//********** Mark Reminders as completed *************//
router.post('/complete', function (req, res, next) {
    const selected = req.body.selected
    repository.completeSelected(selected)
        .then(() => { res.status(200).json({ success: true }) })
        .catch((error) => console.log(error))
});

//*********** Soft Delete Notes / Reminders *************//
router.post('/delete', function (req, res, next) {
    const selected = req.body.selected
    repository.deleteSelected(selected)
        .then(() => { res.status(200).json({ success: true }) })
        .catch((error) => console.log(error))
});

//*********** Hard Delete Notes / Reminders *************//
router.post('/wipe', function (req, res, next) {
    const selected = req.body.selected
    repository.wipeSelected(selected)
        .then(() => { res.status(200).json({ success: true }) })
        .catch((error) => console.log(error))
});

module.exports = router;