const mongoose = require('mongoose');

const RemindersSchema = new mongoose.Schema({
user_id: {
type: String
},
reminders: {
  type: Object
}
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