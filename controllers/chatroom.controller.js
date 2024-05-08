const ChatRoom = require('../models/ChatRoomModel');
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

exports.getAllChatRooms = (req, res) => {
  ChatRoom.find()
    .then(async rooms => {
     if(rooms) {
      res.status(200).json({ success: true, chatRooms: rooms });
     } else {
      res.status(404).json({ success: false, message: "An unexpected error has occurred" });
     }
    })
    .catch((error) => {
      res.status(404).json({ success: false, message: "An unexpected error has occurred", error: error });
    })
};

exports.createChatRoom = async (  roomName, organization, isPrivate, password) => {
  try {
    const chatRoom = new ChatRoom({
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

exports.findRoomById = (roomId) => {
ChatRoom.findOne({_id: roomId})

};

exports.addMessage = (data) => {
  const { roomId, message, user, userId, profileImage, organization, reactions, timestamp } = data;
  const messageId = crypto.randomBytes(16).toString("hex");
  ChatRoom.findOne({ _id: roomId })
      .then(async existingChatRoom => {
        const newMessage = {
          messageId,
          roomId,
          text: message,
          user,
          userId,
          profileImage,
          time: `${timestamp.hour}:${timestamp.mins}`,
          reactions
        };
          if (existingChatRoom) {
              existingChatRoom.messages.push(newMessage)
              existingChatRoom.save();
              return existingChatRoom.messages
          } else {
              res.status(404).json({ success: false, message: "User not found" });
          }
      })
};