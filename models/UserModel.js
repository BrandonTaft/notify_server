const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userName: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    organization: String,
    profileImage: String,
    bannerImage: String,
    isLoggedIn: Boolean,
    expoPushToken: String,
    deviceId: String,
    notes: [
        {
            body: String,
            date: Date,
            isDeleted: Boolean
        }
    ],
    privateRooms: [
        {
            roomId: String,
            date: Date,
            recieverId: String,
            reciever: String,
            senderId: String,
            sender: String,
            isPrivate: Boolean,
            messages: [
                {
                    messageId: String,
                    roomId: String,
                    text: String,
                    sender: String,
                    senderId: String,
                    reciever: String,
                    recieverId: String,
                    profileImage: String,
                    time: String,
                    reactions: Object
                }
            ]
        }
    ]

});
UserSchema.index(
    {
        userName: 1
    },
    {
        collation: {
            locale: 'en',
            strength: 2
        }
    }
)
const User = mongoose.model('User', UserSchema);

module.exports = User;