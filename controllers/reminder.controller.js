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
  // const reminderId = crypto.randomBytes(16).toString("hex");
  const userId = req.body.userId;
  const reminder = req.body.reminder;
  try {
    const result = await Reminders.updateOne(
      { user_id: userId },
      // { $push: { reminders: { reminder_id: reminderId, ...reminder } } },
      { $push: { reminders: reminder } },
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
  Reminders.findOneAndUpdate({ user_id: userId, 'reminders._id': updatedReminder.reminderId },
    { $set: { "reminders.$": {...updatedReminder, _id: updatedReminder.reminderId } } })
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

exports.deleteById = async (req, res) => {
  const reminderId = req.body.reminderId;
  const userId = req.body.userId;
  Reminders.findOneAndUpdate({ user_id: userId }, { $pull: { reminders: { _id: reminderId } } })
    .then(async user => {
      res.status(200).json({ success: true, message: "Reminder was deleted" });
    })
    .catch(() => {
      res.status(404).json({ success: false, message: "Unable to locate reminder" });
    })
};