const Reminders = require('../models/RemindersModel');
const crypto = require("crypto");


exports.getAllReminders = (req, res) => {
  const userId = req.body.userId;
  console.log("GETALLREMINDERS",userId)
  Reminders.findOne({ user_id: userId }).collation({ locale: 'en', strength: 2 })
    .then(async reminders => {
      console.log(reminders)
      if (reminders) {
        res.status(200).json({ success: true, reminders: reminders.reminders });
      } else {
        res.status(200).json({ success: false, message: "No reminders saved!" });
      }
    })
    .catch((error) => {
      console.log(error)
      res.status(404).json({ success: false, message: "Unable to locate user" });
    })
};

// exports.getAllDueReminders = (req, res) => {
//  const date = new Date();
//  const currentDate = date.toLocaleDateString('en-US') 
// Reminders.aggregate([
//   {$unwind:"$reminders"},
// {$match:{"reminders.dueDay":  currentDate}},
// ])
//     .then(async reminders => {
//       console.log(reminders)
//       if(reminders) {
//       res.status(200).json({ success: true, reminders: reminders });
//       } else {
//         res.status(200).json({ success: false, message: "No reminders saved!" });
//       }
//     })
//     .catch((error) => {
//       console.log(error)
//       res.status(404).json({ success: false, message: "Unable to locate user" });
//     })
// };

exports.getAllDueReminders = async (req, res) => {
  const date = new Date();
  const currentDate = date.toLocaleDateString('en-US')
  let data = await Reminders.aggregate([
    { $unwind: "$reminders" },
    { $match: { "reminders.dueDay": currentDate } },
  ])
  console.log("DATAAAa",data)

};


exports.addReminder = async (req, res) => {
  // const reminderId = crypto.randomBytes(16).toString("hex");
  console.log("KKKK", req.body)
  const userId = req.body.userId;
  const reminder = req.body.reminder;
  try {
    const result = await Reminders.findOneAndUpdate(
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
    console.log(error)
    res.status(404).json({ success: false, message: "Unable to complete request", error: error });
  }
};

exports.updateById = (req, res) => {
  const userId = req.body.userId;
  const updatedReminder = req.body.updatedReminder;
  console.log("TESSST", req.body)
  Reminders.findOneAndUpdate({ user_id: userId, 'reminders.reminderId': updatedReminder.reminderId },
    { $set: { "reminders.$": { ...updatedReminder } } })
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
exports.clearById = async (req, res) => {
  const reminderId = req.body.reminderId;
  const userId = req.body.userId;
  Reminders.findOneAndUpdate({ user_id: userId }, { $pull: { reminders: { reminderId: reminderId } } })
    .then(async user => {
      res.status(200).json({ success: true, message: "Reminder was deleted" });
    })
    .catch(() => {
      res.status(404).json({ success: false, message: "Unable to locate reminder" });
    })
};

exports.deleteById = async (req, res) => {
  const reminderId = req.body.reminderId;
  const userId = req.body.userId;
  Reminders.findOneAndUpdate({ user_id: userId, "reminders.reminderId": reminderId }, { $set: { "reminders.$.isDeleted": true } })
    .then(async user => {
      res.status(200).json({ success: true, message: "Reminder was deleted" });
    })
    .catch(() => {
      res.status(404).json({ success: false, message: "Unable to locate reminder" });
    })
};

exports.completeById = async (req, res) => {
  const reminderId = req.body.reminderId;
  const userId = req.body.userId;
  Reminders.findOneAndUpdate({ user_id: userId, "reminders.reminderId": reminderId }, { $set: { "reminders.$.isCompleted": true } })
    .then(async user => {
      res.status(200).json({ success: true, message: "Reminder was deleted" });
    })
    .catch(() => {
      res.status(404).json({ success: false, message: "Unable to locate reminder" });
    })
};