const mongoose = require('mongoose');

const RemindersSchema = new mongoose.Schema({
  user_id: {
    type: String
  },
  reminders: [
    {
      reminderId: String,
      title: String,
      requiresNotification: Boolean,
      dueDay: String,
      dueTime: Object,
      expoPushToken: String,
      isChecked: Boolean,
      isCompleted: Boolean,
      isDeleted: Boolean
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