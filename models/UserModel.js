const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userName: {
        type: String
    },
    password: {
        type: String
    },
    organization: {
        type: String
    },
    profileImage: {
        type: String
    },
    backgroundImage: {
        type: String
    },
    isLoggedIn: {
        type: Boolean
    },
    token: {
        type: String
    },
    deviceId: {
        type: String
    },
    reminders: {
        type: Object
    }
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