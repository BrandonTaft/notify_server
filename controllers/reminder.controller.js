const Reminders = require('../models/RemindersModel');
const crypto = require("crypto");


exports.getAllReminders = (req, res) => {
  const userId = req.body.userId;
  Reminders.findOne({ user_id: userId }).collation({ locale: 'en', strength: 2 })
    .then(async user => {
      res.status(200).json({ success: true, reminders: user.reminders });
    })
    .catch(() => {
      res.status(404).json({ success: false, message: "Unable to locate user" });
    })
};

exports.addReminder = async (req, res) => {
  const reminderId = crypto.randomBytes(16).toString("hex");
  const userId = req.body.userId;
  const reminder = req.body.reminder;
  try {
    const result = await Reminders.updateOne(
      { user_id: userId },
      { $push: { reminders: { reminder_id: reminderId, ...reminder } } },
      { "upsert": true }).collation({ locale: 'en', strength: 2 }
      )
    if (result.upsertedId === null) {
      res.status(201).json({ success: true, message: "Reminder was added to existing user" })
    } else {
      res.status(201).json({ success: true, message: "New User was added with reminder" })
    }
  } catch (error) {
    res.status(404).json({ success: false, message: "Unable to complete request", error: error });
  }
};

exports.updateById = (req, res) => {
  const userId = req.body.userId;
  const updatedReminder = req.body.updatedReminder;
  Reminders.findOneAndUpdate({ user_id: userId, 'reminders.reminder_id': updatedReminder.reminderId },
    { $set: { "reminders.$": updatedReminder } })
    .then(async reminder => {
      if (reminder !== null) {
        res.status(200).json({ success: true, message: "Reminder has been updated" });
      } else {
        res.status(404).json({ success: false, message: "Unable to locate user" });
      }
    })
    .catch(() => {
      res.status(404).json({ success: false, message: "Unable to locate user" });
    })
};

exports.deleteById = (req, res) => {
  const reminderId = req.body.reminderId;
  const userId = req.body.userId;
  Reminders.findOneAndDelete({ user_id: userId, 'reminders.reminder_id': reminderId })
    .then(async reminder => {
      if (reminder !== null) {
        res.status(200).json({ success: true, message: "Reminder has been updated" });
      } else {
        res.status(404).json({ success: false, message: "Unable to locate user" });
      }
    })
    .catch(() => {
      res.status(404).json({ success: false, message: "Unable to locate user" });
    })
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
