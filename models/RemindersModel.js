const mongoose = require('mongoose');

const RemindersSchema = new mongoose.Schema({
//   name: {
//     type: String,
//   },
//   phoneNumber:{
//     type: String,
//   },
//   notification:{
//     type: String,
//   },
//  month:{
//     type: String,
//   },
//   day:{
//     type:String,
//   },
//   time:{
//     type:String,
//   },
//   done: {
//     type: Boolean,
//   },
//   priority:{
//     type: Boolean,
//   },
//   isDeleted:{
//     type: Boolean,
//   },
//   token:{
//     type:String
//   },
//   note:{
//     type: Boolean
//   }
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