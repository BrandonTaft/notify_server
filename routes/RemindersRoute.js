'use strict';
const express = require('express');
const session = require('express-session');
const controller = require('../controllers/reminder.controller');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser")
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

router.post('/', controller.getAllReminders);

router.post('/add-reminder', controller.addReminder);

router.post('/update', controller.updateById);


//*********** Get All Notes ***********//
router.get('/notes', (req, res, next) => {
    controller.findAllNotes()
        .then((notes) => { res.json({ success: true, notes: notes }) })
        .catch((error) => console.log(error));
});

//************* Add Reminders **************//
// router.post('/', function (req, res, next) {
//     let newReminder = req.body;
//     controller.create(newReminder)
//         .then(res.status(200).json({ success: true }))
//         .catch((error) => console.log(error))
// });

//************* Add Notes **************//
router.post('/notes', function (req, res, next) {
    let note = req.body;
    controller.createNote(note)
        .then(res.status(200).json({ success: true }))
        .catch((error) => console.log(error))
});

//*********** Update Reminders *************//
// router.put('/', (req, res) => {
//     let reminder = req.body;
//     controller.updateById(reminder)
//         .then(res.status(200).json({ success: true }))
//         .catch((error) => console.log(error));
// });

//*********** Update Notes *************//
router.put('/notes', function (req, res, next) {
    const note = req.body;
    controller.updateNoteById(note)
        .then(res.status(200).json({ success: true }))
        .catch((error) => console.log(error));
});

//********** Restore Reminders and notes *************//
router.post('/restore', function (req, res, next) {
    const selected = req.body.selected
    controller.restoreSelected(selected)
        .then(() => { res.status(200).json({ success: true }) })
        .catch((error) => console.log(error))
});

//********** Mark Reminders as completed *************//
router.post('/complete', function (req, res, next) {
    const selected = req.body.selected
    controller.completeSelected(selected)
        .then(() => { res.status(200).json({ success: true }) })
        .catch((error) => console.log(error))
});

//*********** Soft Delete Notes / Reminders *************//
router.post('/delete', function (req, res, next) {
    const selected = req.body.selected
    controller.deleteSelected(selected)
        .then(() => { res.status(200).json({ success: true }) })
        .catch((error) => console.log(error))
});

//*********** Hard Delete Notes / Reminders *************//
router.post('/wipe', function (req, res, next) {
    const selected = req.body.selected
    controller.wipeSelected(selected)
        .then(() => { res.status(200).json({ success: true }) })
        .catch((error) => console.log(error))
});

module.exports = router;