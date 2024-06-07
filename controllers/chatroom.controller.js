const ChatRoom = require('../models/ChatRoomModel');
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

exports.createChatRoom = async ( roomId, roomName, ownerId, ownerName,  isPrivate, organization) => {
  try {
    const chatRoom = new ChatRoom({
      roomId,
      roomName,
      ownerId,
      ownerName,
      isPrivate,
      organization,
      messages: []   
    });
    let savedChatRoom = await chatRoom.save();
    if (savedChatRoom !== null) {
      return savedChatRoom
    }
  } catch (error) {
    console.log("Unable to complete request", error );
  }
};

exports.getAllChatRooms = (req, res) => {
  ChatRoom.find({isPrivate: false})
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

exports.getAllPrivateChatRooms = (req, res) => {
  const userId = req.body.userId

  // ChatRoom.find({isPrivate: true, })
  ChatRoom.find({ $or:[ {'roomId': userId}, {'ownerId': userId} ], isPrivate: true, })
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



exports.createPrivateRoom = async (  roomName, ownerId, isPrivate, password) => {
  try {
    const chatRoom = new ChatRoom({
      roomName: roomName,
      ownerId: ownerId,
      messages: [],
      isPrivate: isPrivate,
    });
    let savedChatRoom = await chatRoom.save();
    if (savedChatRoom !== null) {
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