const ChatRoom = require('../models/ChatRoomModel');
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

exports.getAllChatRooms = () => {
  ChatRoom.find()
    .then(async rooms => {
     
    })
    .catch(() => {
      
    })
};

exports.createChatRoom = async (  roomName, organization, isPrivate, password) => {
  const roomId = crypto.randomBytes(16).toString("hex");
  try {
    const chatRoom = new ChatRoom({
      roomId: roomId,
      roomName: roomName,
      organization: organization,
      messages: [],
      isPrivate: isPrivate,
    });
    let savedChatRoom = await chatRoom.save();
    if (savedChatRoom !== null) {
      console.log("Saved Chatroom", savedChatRoom)
      return savedChatRoom
    }
  } catch (error) {
    console.log("Unable to complete request", error );
  }
};

exports.addMessage = (req, res) => {
  let userId = req.body.userId;
  let note = req.body.note
  User.findOne({ _id: userId })
      .then(async existingUser => {
          if (existingUser) {
              existingUser.notes.push(note)
              existingUser.save();
              res.status(201).json({ success: true, message: "Note added" });
          } else {
              res.status(404).json({ success: false, message: "User not found" });
          }
      })
};
