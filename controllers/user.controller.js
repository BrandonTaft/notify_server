const User = require('../models/UserModel');
const multer = require('multer');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const salt = 10;
require('dotenv').config();

exports.registerUser = (req, res) => {
    const { userName, password, organization } = req.body.user;
    User.findOne({ userName: userName }).collation({ locale: 'en', strength: 2 })
        .then(async existingUser => {
            if (existingUser === null) {
                bcrypt.hash(password, salt, async (error, hash) => {
                    if (error) {
                        res.status(400).json({
                            success: false,
                            message: "Unable to process request",
                            error: error
                        });
                    } else {
                        const user = new User({
                            userName: userName,
                            password: hash,
                            organization: organization,
                            isLoggedIn: false
                        });

                        let savedUser = await user.save()
                        if (savedUser !== null) {
                            res.status(201).json({ success: true, message: "User is registered" })
                        }
                    }
                })
            } else {
                res.status(200).json({ success: false, message: "That name is taken" });
            }
        })
};

exports.logInUser = (req, res) => {
    const { userName, password } = req.body.user;
    User.findOne({ userName: userName }).collation({ locale: 'en', strength: 2 })
        .then(async existingUser => {
            if (existingUser) {
                bcrypt.compare(password, existingUser.password, (error, verifiedUser) => {
                    if (verifiedUser) {
                        existingUser.isLoggedIn = true;
                        existingUser.save();
                        const token = jwt.sign(
                            { userName: userName },
                            process.env.JWT_SECRET_KEY,
                            { expiresIn: process.env.JWT_EXPIRES_IN }
                        );
                        res.status(201).json({
                            sucess: true,
                            token,
                            existingUser,
                        });
                    } else {
                        res.status(403).json({
                            success: false,
                            message: "Unable to authenticate user",
                            error: error
                        });
                    }
                })
            } else {
                res.status(404).json({ success: false, message: "User not found" });
            }
        })
};

exports.logOutUser = (req, res) => {
    const { _id } = req.body.user;
    User.findOne({ _id: _id })
        .then(async existingUser => {
            if (existingUser) {
                existingUser.isLoggedIn = false;
                existingUser.save();
                res.status(200).json({ success: true, message: "User is logged out" });
            } else {
                res.status(404).json({ success: false, message: "User not found" });
            }
        })
};

exports.updateUserProfile = (req, res) => {
    let _id = req.body._id;
    let updatedProfileData = req.body.updatedProfileData
    User.findOne({ _id: _id })
        .then(async existingUser => {
            if (existingUser) {
                Object.assign(existingUser, updatedProfileData)
                existingUser.save();
                res.status(201).json({ success: true, message: "Updated user profile" });
            } else {
                res.status(404).json({ success: false, message: "User not found" });
            }
        })
};

exports.getAllUsers = (req, res) => {
    User.find()
        .then(async users => {
            res.status(200).json({ success: true, users: users });
        })
        .catch(() => {
            res.status(404).json({ success: false, message: "Unable to load database" });
        })
};

exports.getAllLoggedInUsers = (req, res) => {
    User.find({ isLoggedIn: true })
        .then(async users => {
            res.status(200).json({ success: true, users: users });
        })
        .catch(() => {
            res.status(404).json({ success: false, message: "Unable to load database" });
        })
};