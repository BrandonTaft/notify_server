const User = require('../models/UserModel');
const Organization = require('../models/OrganizationModel');
const multer = require('multer');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const salt = 10;
require('dotenv').config();

exports.registerUser = (req, res) => {
    const { userName, password, organization, expoPushToken } = req.body.user;
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
                            isLoggedIn: false,
                            expoPushToken: expoPushToken
                        });

                        let savedUser = await user.save()
                        if (savedUser !== null) {
                            await Organization.updateOne(
                                {name:organization},
                                { $push: { users: {name:userName, userId: savedUser._id} } },
                                ).collation({ locale: 'en', strength: 2 }
                            )
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
    console.log("LOGIN", req.body)
    User.findOne({ userName: userName }).collation({ locale: 'en', strength: 2 })
        .then(async existingUser => {
            if (existingUser) {
                bcrypt.compare(password, existingUser.password, (error, verifiedUser) => {
                    if (verifiedUser) {
                        existingUser.isLoggedIn = true;
                        existingUser.save();
                        const token = jwt.sign(
                            { id: existingUser._id, userName: userName },
                            process.env.JWT_SECRET_KEY
                        );
                        res.status(201).json({
                            success: true,
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

exports.refreshUser = (req, res) => {
    const  userId  = req.body.userId;
    console.log(userId)
    User.findOne({ _id: userId })
        .then(async existingUser => {
            if (existingUser) {
                res.status(201).json({
                    success: true,
                    existingUser,
                });
            } else {
                res.status(403).json({
                    success: false,
                    message: "Unable to authenticate user",
                });
            }
        })
};

exports.logOutUser = (req, res) => {
    const { userId } = req.body.user;
    User.findOne({ _id: userId })
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

exports.deleteUser = (req, res) => {
    const { userId } = req.body.user;
    User.deleteOne({ _id: userId })
        .then((result) => {
            if(result.deletedCount === 1) {
                res.status(200).json({ success: true, message: "Profile was deleted" });
            } else {
                res.status(404).json({ success: false, message: "There was an error deleting the profile" });
            }
        })
};


exports.updateUserProfile = (req, res) => {
    let userId = req.body.userId;
    let updatedProfileData = req.body.updatedProfileData
    User.findOne({ _id: userId })
        .then(async existingUser => {
            console.log("IRANN", existingUser.userName.toLowerCase(),updatedProfileData.userName.toLowerCase() )
            if (existingUser.userName.toLowerCase() === updatedProfileData.userName.toLowerCase()) {
                Object.assign(existingUser, {organization: updatedProfileData.organization})
                existingUser.save();
                res.status(201).json({ success: true, upDatedProfile: existingUser, message: "Updated user profile" });
            } else {
                User.findOne({ userName: updatedProfileData.userName }).collation({ locale: 'en', strength: 2 })
                    .then((result) => {
                        
                        if (result === null) {
                            Object.assign(existingUser, updatedProfileData)
                            existingUser.save();
                            res.status(201).json({ success: true, upDatedProfile: existingUser, message: "Updated user profile" });
                        } else {
                            res.status(200).json({ success: false, message: "That name is taken" });
                        }
                    })
            }
        })
};

exports.updateProfileImage = (req, res) => {
    let image = req.body.image;
    let userId = req.body.userId;
    let imageType = req.body.imageType;
    User.findOne({ _id: userId })
        .then(async existingUser => {
            if (existingUser) {
                existingUser[imageType] = image
                existingUser.save();
                res.status(201).json({ success: true, message: "Updated user profile" });
            } else {
                res.status(404).json({ success: false, message: "An unexpected error has occurred" });
            }
        })
};

exports.getAllUsers = (req, res) => {
    User.find().select("-password -notes -bannerImage")
        .then(async users => {
            res.status(200).json({ success: true, users: users });
        })
        .catch(() => {
            res.status(404).json({ success: false, message: "Unable to load users" });
        })
};

exports.getAllLoggedInUsers = (req, res) => {
    User.find({ isLoggedIn: true })
        .then(async users => {
            res.status(200).json({ success: true, users: users });
        })
        .catch(() => {
            res.status(404).json({ success: false, message: "Unable to load users" });
        })
};

exports.getUserNotes = (req, res) => {
    const userId = req.body.userId;
    User.findOne({ _id: userId }).collation({ locale: 'en', strength: 2 })
        .then(async user => {
            res.status(200).json({ success: true, notes: user.notes });
        })
        .catch(() => {
            res.status(404).json({ success: false, message: "Unable to locate user" });
        })
};

exports.addNote = (req, res) => {
    let userId = req.body.userId;
    let note = req.body.note
    User.findOne({ _id: userId })
        .then(async existingUser => {
            if (existingUser) {
                existingUser.notes.push({...note, isDeleted: false})
                existingUser.save();
                res.status(201).json({ success: true, message: "Note added", notes: existingUser.notes });
            } else {
                res.status(404).json({ success: false, message: "User not found" });
            }
        })
};

exports.updateNoteById = (req, res) => {
    const userId = req.body.userId;
    const updatedNote = req.body.updatedNote;
    console.log("NOTEEEE", updatedNote)
    User.findOneAndUpdate({ _id: userId, 'notes._id': updatedNote.noteId },
        { $set: { "notes.$": { body:updatedNote.content, _id: updatedNote.noteId } } })
        .then(async note => {
            if (note !== null) {
                res.status(200).json({ success: true, message: "note has been updated" });
            } else {
                res.status(404).json({ success: false, message: "Unable to locate user" });
            }
        })
        .catch(() => {
            res.status(404).json({ success: false, message: "Unable to locate user" });
        })
};

exports.deleteNoteById = async (req, res) => {
    const noteId = req.body.noteId;
    const userId = req.body.userId;
    User.findOneAndUpdate({ user_id: userId }, { $pull: { notes: { _id: noteId } } })
        .then(async user => {
            res.status(200).json({ success: true, message: "Note was deleted" });
        })
        .catch(() => {
            res.status(404).json({ success: false, message: "Unable to locate note" });
        })
};

exports.createPrivateRoom = async ( roomId, reciever, recieverId, senderId, sender ) => {
    const room = {
        roomId,
        reciever,
        recieverId,
        senderId,
        senderId,
        sender,
        isPrivate: true
    }
  try {
console.log("PRIVATEEEE")
    User.findOne({ _id: senderId, 'privateRooms.roomId': roomId })
    .then(async privateRoom => {
        if(privateRoom === null) {
            User.findOneAndUpdate(
                    { _id: senderId },
                    { $push: { privateRooms: room } }
                    ).then(()=>{
                        User.findOneAndUpdate(
                            { _id: recieverId },
                            { $push: { privateRooms: room } }
                            )
                    })
        }
    })
  } catch (error) {
    console.log("Unable to complete request", error );
  }
};

exports.updatePrivateRoom = async ( senderId, roomId, newMessage ) => {
  try {
    User.findOneAndUpdate({ _id: senderId, 'privateRooms.roomId': roomId },
        { $push: { "privateRooms.$": {messages: newMessage} } },
        // { "upsert": true }).collation({ locale: 'en', strength: 2 }
                ).then(async(result) => console.log(result))
        // { $set: { "notes.$": { body:updatedNote.content, _id: updatedNote.noteId } } })
        // .then(async note => {
        //     if (note !== null) {
        //         res.status(200).json({ success: true, message: "note has been updated" });
        //     } else {
        //         res.status(404).json({ success: false, message: "Unable to locate user" });
        //     }
        // })
        // .catch(() => {
        //     res.status(404).json({ success: false, message: "Unable to locate user" });
        // })

    // User.findOneAndUpdate(
    //     { _id: senderId },
    //     { $push: { privateRooms: room } },
    //     { "upsert": true }).collation({ locale: 'en', strength: 2 }
    //     ).then((result) => console.log(result))
    
    // if (privateRoom) {
    //   return privateRoom
    // }
  } catch (error) {
    console.log("Unable to complete request", error );
  }
};