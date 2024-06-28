const mongoose = require('mongoose');

const ChatRoomSchema = new mongoose.Schema({
    roomId: String,
    ownerId: String,
    ownerName: String,
    roomName: String,
    organization: String,
    isPrivate: Boolean,
    messages: [
        {
            messageId: String,
            roomId: String,
            text: String,
            sender: String,
            userId: String,
            profileImage: String,
            time: String,
            reactions: Object
        }
    ]

});
ChatRoomSchema.index(
    {
        roomName: 1
    },
    {
        collation: {
            locale: 'en',
            strength: 2
        }
    }
)
const ChatRoom = mongoose.model('ChatRoom', ChatRoomSchema);

module.exports = ChatRoom;