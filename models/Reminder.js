const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
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
reminders: {
  type: Object
}
});

const Reminder = mongoose.model('Reminder', Schema);

module.exports = Reminder;