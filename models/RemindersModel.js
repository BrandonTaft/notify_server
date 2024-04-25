const mongoose = require('mongoose');

const RemindersSchema = new mongoose.Schema({
  user_id: {
    type: String
  },
  reminders: [
    {
      title: String,
      requiresNotification: Boolean,
      dueDay: Number
    }
  ]
});
RemindersSchema.index(
  {
    user_id: 1
  },
  {
    collation: {
      locale: 'en',
      strength: 2
    }
  }
)
const Reminder = mongoose.model('Reminder', RemindersSchema);

module.exports = Reminder;