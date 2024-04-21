const Reminders = require('../models/RemindersModel');

exports.getAllReminders = (req, res) => {
  const user_id = req.body.user_id;
  Reminders.findOne({ user_id: user_id }).collation({ locale: 'en', strength: 2 })
    .then(async user => {
      res.status(200).json({ success: true, reminders: user.reminders });
    })
    .catch(() => {
      res.status(404).json({ success: false, message: "Unable to locate user" });
    })
};

exports.addReminder = async (req, res) => {
  const user_id = req.body.user_id;
  const reminder = req.body.reminder;
  const result = await Reminders.updateOne(
    { user_id: user_id },
    { $push: { reminders: reminder } },
    { "upsert": true }).collation({ locale: 'en', strength: 2 }
    )
  if (result.upsertedId === null) {
    res.status(201).json({ success: true, message: "Reminder was added to existing user" })
  } else {
    res.status(201).json({ success: true, message: "New User was added with reminder" })
  }
};


exports.updateById = (req, res) => {
  const reminderTitle = req.body.reminderId;
  // return Reminders.findOne({ $and: [{ month: currentDate }, { day: currentDay }, { time: currentTime }] });
  Reminders.find({ reminders: {title: reminderTitle} })
  .then(async reminder => {
    res.status(200).json({ success: true, reminder: reminder });
  })
  .catch(() => {
    res.status(404).json({ success: false, message: "Unable to locate user" });
  })
  // const query = { _id: reminder.id };
  // let newDate = new Date(reminder.notification)
  // return Reminder.findOneAndUpdate(query, {
  //   $set: {
  //     name: reminder.name,
  //     done: reminder.done,
  //     notification: reminder.notification,
  //     month: newDate.getMonth(),
  //     day: newDate.getDate(),
  //     time: newDate.toLocaleTimeString('en-US'),
  //     priority: reminder.priority,
  //     token: reminder.token
  //   }
  // })
};


// createNote(note) {
//   let newDate = new Date()
//   const newNote = {
//     name: note.name,
//     note: note.note,
//     time: newDate,
//     isDeleted: false,
//     priority: false
//   }
//   const Reminder = new Reminder(newNote);
//   return Reminder.save();
// };

// findByDevice(deviceId) {
//   return Reminder.find({ deviceId: deviceId });
// };

// findAll() {
//   return Reminder.find();
// };

// findAllNotes() {
//   return Reminder.find({ note: true, isDeleted: false });
// };

// findByTime(currentDate, currentDay, currentTime) {
//   return Reminder.find({ $and: [{ month: currentDate }, { day: currentDay }, { time: currentTime }] });
// };

// deleteSelected(selected) {
//   return Reminder.updateMany({ _id: { $in: selected } }, { $set: { isDeleted: true } })
// };

// restoreSelected(selected) {
//   return Reminder.updateMany({ _id: { $in: selected } }, { $set: { isDeleted: false } })
// };

// wipeSelected(selected) {
//   return Reminder.deleteMany({ _id: { $in: selected } }, { $set: { isDeleted: true } })
// };

// completeSelected(selected) {
//   return Reminder.updateMany({ _id: { $in: selected } }, { $set: { done: true } })
// };

// updateById(reminder) {
//   const query = { _id: reminder.id };
//   let newDate = new Date(reminder.notification)
//   return Reminder.findOneAndUpdate(query, {
//     $set: {
//       name: reminder.name,
//       done: reminder.done,
//       notification: reminder.notification,
//       month: newDate.getMonth(),
//       day: newDate.getDate(),
//       time: newDate.toLocaleTimeString('en-US'),
//       priority: reminder.priority,
//       token: reminder.token
//     }
//   })
// };

// updateNoteById(note) {
//   const query = { _id: note.id };
//   let newDate = new Date()
//   return Reminder.findOneAndUpdate(query, {
//     $set: {
//       name: note.name,
//       time: newDate,
//       note: true,
//       priority: false
//     }
//   })
// };
