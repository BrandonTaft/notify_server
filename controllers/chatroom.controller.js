const ChatRoom = require('../models/ChatRoomModel');

exports.getAllChatRooms = (req, res) => {
    ChatRoom.find()
        .then(async rooms => {
            res.status(200).json({ success: true, rooms: rooms });
        })
        .catch(() => {
            res.status(404).json({ success: false, message: "Unable to load database" });
        })
};

exports.addChatRoom = async (roomId, roomName, organization) => {
    try {
      const result = await Reminders.updateOne(
        { user_id: userId },
        // { $push: { reminders: { reminder_id: reminderId, ...reminder } } },
        { $push: { reminders: reminder } },
        { "upsert": true }).collation({ locale: 'en', strength: 2 }
        )
      if (result.upsertedId === null) {
        res.status(201).json({ success: true, message: "Reminder was added to existing user" })
      } else {
        res.status(201).json({ success: true, message: "New User was added with reminder" })
      }
    } catch (error) {
      res.status(404).json({ success: false, message: "Unable to complete request", error: error });
    }
  };
  