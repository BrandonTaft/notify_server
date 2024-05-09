'use strict';
const express = require('express');
const session = require('express-session');
const orgController = require('../controllers/organization.controller');
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

//router.get('/', authenticateUser, controller.getAllUsers)

router.post('/create', orgController.createOrganization)

module.exports = router;