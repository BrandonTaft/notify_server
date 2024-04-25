const ChatRoom = require('../models/ChatRoomModel');

exports.getAllUsers = (req, res) => {
    ChatRoom.find()
        .then(async rooms => {
            res.status(200).json({ success: true, rooms: rooms });
        })
        .catch(() => {
            res.status(404).json({ success: false, message: "Unable to load database" });
        })
};