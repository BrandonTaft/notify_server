const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
userSchema.index(
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
const User = mongoose.model('User', userSchema);

module.exports = User;