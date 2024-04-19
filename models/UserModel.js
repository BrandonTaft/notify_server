const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user_id: {
        type: String
    },
    user_name: {
        type: String
    },
    password: {
        type: String
    },
    organization: {
        type: String
    },
    profile_image: {
        type: String
    },
    background_image: {
        type: String
    },
    is_logged_in: {
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
        user_name: 1
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