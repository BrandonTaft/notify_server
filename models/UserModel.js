const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user_name: {
        type: String,
    },
    user_id: {
        type: String,
    },
    organization: {
        type: String,
    },
    profile_image: {
        type: String,
    },
    background_image: {
        type: String,
    },
    password: {
        type: String,
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
userSchema.index({user_name: 1})
const User = mongoose.model('User', userSchema);

module.exports = User;