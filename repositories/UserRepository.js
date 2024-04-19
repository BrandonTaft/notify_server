const User = require('../models/UserModel');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const salt = 10;
require('dotenv').config();

class UserRepository {
    constructor(model) {
        this.model = model;
    };

    registerUser(user, res) {
        const { user_id, userName, password, organization } = user;
        this.model.findOne({ user_name: userName }).collation({ locale: 'en', strength: 2 })
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
                            const user = new this.model({
                                user_id: user_id,
                                user_name: userName,
                                password: hash,
                                organization: organization,
                                is_logged_in: false
                            })

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

    logInUser(user, res) {
        const { userName, password } = user;
        this.model.findOne({ user_name: userName }).collation({ locale: 'en', strength: 2 })
            .then(async existingUser => {
                if (existingUser) {
                    bcrypt.compare(password, existingUser.password, (error, verifiedUser) => {
                        if (verifiedUser) {
                            existingUser.is_logged_in = true;
                            existingUser.save();
                            const token = jwt.sign(
                                { userName: userName },
                                process.env.JWT_SECRET_KEY,
                                { expiresIn: process.env.JWT_EXPIRES_IN }
                            );
                            res.status(201).json({
                                sucess: true,
                                token,
                                data: { existingUser },
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

    logOutUser(user, res) {
        const { userName } = user;
        this.model.findOne({ user_name: userName }).collation({ locale: 'en', strength: 2 })
            .then(async existingUser => {
                if (existingUser) {
                    existingUser.is_logged_in = false;
                    existingUser.save();
                    res.status(200).json({ success: true, message: "User is logged out" });
                } else {
                    res.status(404).json({ success: false, message: "User not found" });
                }
            })
    };
}

module.exports = new UserRepository(User);