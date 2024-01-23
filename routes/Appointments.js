'use strict';
const express = require('express');
const session = require('express-session');
const { Vonage } = require('@vonage/server-sdk')
const moment = require('moment');
var momentDurationFormatSetup = require("moment-duration-format");
const Appointment = require('../models/Appointment');
const repository = require('../repositories/AppointmentRepository');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser")
const finder = require('../lib/finder')
require('dotenv').config()

const vonage = new Vonage({
    apiKey: "2cb606e4",
    apiSecret: "q7uMAqANqgJCSUtC"
})

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

//*********** Get All Items From The Database ***********//

router.get('/', (req, res, next) => {
    repository.findAll().then((appointments) => {
        const scheduled = appointments.filter((item) => item.notification && !item.done && !item.isDeleted).sort((a, b) => {
            if (a.notification !== null && b.notification !== null) {
                return new Date(a.notification) - new Date(b.notification);
            }
        })
        const unScheduled = appointments.filter((item) => !item.notification && !item.done && !item.isDeleted)
        const completed = appointments.filter((item) => item.done && !item.isDeleted)
        const deleted = appointments.filter((item) => item.isDeleted)
        res.json(
            {
                scheduled: scheduled,
                unScheduled: unScheduled,
                completed: completed,
                deleted: deleted
            }
        );
    }).catch((error) => console.log(error));
});

router.get('/notes', (req, res, next) => {
    repository.findAllNotes().then((notes) => {
        res.json(
            {
                success: true,
                notes: notes
            }
        );
    }).catch((error) => console.log(error));
});

//************* Add Items To The Database **************//

router.post('/', function (req, res, next) {
    let newDate = new Date(req.body.notification)
    const appointment = new Appointment({
        name: req.body.name,
        notification: req.body.notification,
        month: newDate.getMonth(),
        day: newDate.getDate(),
        time: newDate.toLocaleTimeString('en-US'),
        token: req.body.expoPushToken,
        priority: false,
        done: false
    })
    appointment.save().then(function () {
        res.status(200).json({ success: true })
        console.log("Appointment was successfully added :", appointment);
    }).catch((error) => console.log(error));
});

router.post('/notes', function (req, res, next) {
    const appointment = new Appointment({
        name: req.body.name,
        note: req.body.note,
        priority: false
    })
    appointment.save().then(function () {
        res.status(200).json({ success: true })
    }).catch((error) => console.log(error));
});

//*********** Update Item In The Database *************//

router.put('/', (req, res) => {
    const id = req.body.id;
    let newDate = new Date(req.body.notification)
    const reminder = {
        name: req.body.name,
        done: req.body.done,
        notification: req.body.notification,
        month: newDate.getMonth(),
        day: newDate.getDate(),
        time: newDate.toLocaleTimeString('en-US'),
        token: req.body.expoPushToken,
        priority: req.body.priority
    };
    repository.updateById(id, reminder)
        .then(res.status(200).json({ success: true }))
        .catch((error) => console.log(error));
});

router.put('/notes', function (req, res, next) {
    const note = {
        name: req.body.name,
        note: req.body.note,
        id: req.body.id,
        priority: false
    }
    repository.updateNoteById(req.body.id, note)
        .then(res.status(200).json({ success: true }))
        .catch((error) => console.log(error));
});



//*********** Set Reminder Priority *************//

// router.put('/priority/:id', (req, res) => {
//     const { id } = req.params;
//     const reminder = { priority: req.body.priority };
//     repository.setPriority(id, reminder)
//         .then(res.status(200).json({ success: true }))
//         .catch((error) => console.log(error));
// });



//*********** Update All Items In Db / Mark All As Incomplete-Complete/ E.O.D. Refresh *************//

router.put('/', (req, res) => {
    const reminder = { done: false };
    repository.updateAll()
        .then(res.status(200).json({ success: true }))
        .catch((error) => console.log(error));
});

router.post('/complete', function (req, res, next) {
    const selected = req.body.selected
    console.log(selected)
    repository.completeSelected(selected).then(() => {

        res.status(200).json({ success: true })
    })
})

//*********** Delete Item From The Database *************//

router.delete('/:id', (req, res) => {
    const { id } = req.params;
    repository.deleteById(id).then(() => {
        console.log(`Deleted record with id: ${id}`);
        res.status(200).json({ success: true })
    }).catch((error) => console.log(error));
});

router.post('/delete', function (req, res, next) {
    const selected = req.body.selected
    console.log(selected)
    repository.deleteSelected(selected).then(() => {

        res.status(200).json({ success: true })
    })
    // const appointment = new Appointment({
    //     name: req.body.name,
    //     notification: req.body.notification,
    //     priority: req.body.priority,
    //     done: false
    // })
    // appointment.save().then(function () {
    //     res.status(200).json({ success: true })
    //     console.log("Appointment was successfully added :", appointment);
    // }).catch((error) => console.log(error));
});


router.post('/wipe', function (req, res, next) {
    const selected = req.body.selected
    console.log(selected)
    repository.wipeSelected(selected).then(() => {

        res.status(200).json({ success: true })
    })
});
//****************** Deliver Message *******************//

async function sendSMS(to, text) {
    const from = "15713968152"
    await vonage.sms.send({ to, from, text })
        .then(resp => { console.log('Message sent successfully') })
        .catch(err => { console.log('There was an error sending the messages.'); console.error(err); });
}

router.post("/send-message", async (req, res) => {
    try {
        const to = `+1${req.body.to}`
        const text = req.body.message
        sendSMS(to, text)
        res.status(200).json({
            message: `Message Sent To ${req.body.to}`
        })
    } catch (err) {
        res.status(500).json({
            Error: err
        })
    }
})







//******* Recieve Message And Send Auto Response ********//

router.get("/sms", async (req, res) => {
    console.log("test", req.query)
    try {
        var to = `+${req.query.msisdn}`;
        var body = req.query.text;
        if (!isNaN(body)) {
            const id = req.session.update;
            const name = req.session.nameToBeUpdated;
            if (body == 1) {
                repository.deleteById(id).then((ok) => {
                    console.log(`Deleted record with id: ${id}`);
                    //const message = `${name} has been deleted.`
                    const message = "Ithas been deleted."
                    sendSMS(to, message);
                    res.status(200).send()
                    //res.end(twiml.toString())
                }).catch((error) => console.log(error));
            } else if (body == 2) {
                const reminder = { done: true };
                repository.updateById(id, reminder).then(() => {
                    const message = `${name} was marked as complete.`
                    const twiml = new MessagingResponse();
                    twiml.message(message);
                    res.writeHead(200, { 'Content-Type': 'text/xml' });
                    res.end(twiml.toString())
                }).catch((error) => console.log(error));
            } else if (body == 3) {
                req.session.update = undefined
                req.session.notify = true
                const message = "When should I Remind you?"
                const twiml = new MessagingResponse();
                twiml.message(message);
                res.writeHead(200, { 'Content-Type': 'text/xml' });
                res.end(twiml.toString())
            } else {
                const message = "Must choose between 1 and 3 "
                const twiml = new MessagingResponse();
                twiml.message(message);
                res.writeHead(200, { 'Content-Type': 'text/xml' });
                res.end(twiml.toString())
            }
        }
        // else if (req.session.notify == true) {
        //     const reminder = { name: req.session.nameToBeUpdated, notification: body };
        //     var due = moment(reminder.notification,'HH').format('HH:mm');
        //     repository.updateByName(req.session.nameToBeUpdated, reminder)
        //     .then(() => {
        //         const message = `Ok, I will notify you at ${due} `
        //         const twiml = new MessagingResponse();
        //         twiml.message(message);
        //         res.writeHead(200, { 'Content-Type': 'text/xml' });
        //         res.end(twiml.toString())
        //         session_destroy();
        //     }).catch((error) => console.log(error));
        // } else {
        //     //Creates a session to track number of texts from user
        //     //Sets the reply message depending on how many times user has texted
        //     const smsCount = req.session.counter || 0;
        //     let message = `Hello, I've added **${body}** to the list for you!`;
        //     if (smsCount > 0) {
        //         message = `Welcome Back! I've added **${body}** to the list for you!`;
        //     }
        //     req.session.counter = smsCount + 1;

        //     finder.findByName(body, function (err, reminders) {
        //         if (reminders.length === 0) {
        //             //twimlGenerator.notFound(body)
        //             const twiml = new MessagingResponse();
        //             //twiml.message(message);
        //             res.writeHead(200, { 'Content-Type': 'text/xml' });
        //             res.end(twiml.toString())
        //         } else {
        //             let update = reminders[0]._id;
        //             let nameToBeUpdated = reminders[0].name;
        //             req.session.update = update;
        //             req.session.nameToBeUpdated = nameToBeUpdated;
        //             //res.send(twimlGenerator.singleReminder(reminders[0]).toString());
        //         }

        //     })
        // }
    } catch (error) { console.log(error) };
})

module.exports = router;