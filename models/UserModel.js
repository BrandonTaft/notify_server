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
    backgroundImage: String,
    isLoggedIn: Boolean,
    token: String,
    deviceId: String,
    notes: [
        {
            body: String,
            date: Date,
            isDeleted: String
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