const Reminder = require('../models/Reminder');

class ReminderRepository {
  constructor(model) {
    this.model = model;
  };

  create(reminder) {
    let newDate = new Date(reminder.notification)
    const newReminder = {
      name: reminder.name,
      notification: reminder.notification,
      month: newDate.getMonth(),
      day: newDate.getDate(),
      time: newDate.toLocaleTimeString('en-US'),
      token: reminder.expoPushToken,
      priority: false,
      done: false
    }
    const Reminder = new this.model(newReminder);
    return Reminder.save();
  };

  createNote(note) {
    let newDate = new Date()
    const newNote = {
      name: note.name,
      note: note.note,
      time: newDate,
      isDeleted: false,
      priority: false
    }
    const Reminder = new this.model(newNote);
    return Reminder.save();
  };

  findAll() {
    return this.model.find();
  };

  findAllNotes() {
    return this.model.find({ note: true, isDeleted: false });
  };

  findByTime(currentDate, currentDay, currentTime) {
    return this.model.find({ $and: [{ month: currentDate }, { day: currentDay }, { time: currentTime }] });
  };

  deleteSelected(selected) {
    return this.model.updateMany({ _id: { $in: selected } }, { $set: { isDeleted: true } })
  };

  restoreSelected(selected) {
    return this.model.updateMany({ _id: { $in: selected } }, { $set: { isDeleted: false } })
  };

  wipeSelected(selected) {
    return this.model.deleteMany({ _id: { $in: selected } }, { $set: { isDeleted: true } })
  };

  completeSelected(selected) {
    return this.model.updateMany({ _id: { $in: selected } }, { $set: { done: true } })
  };

  updateById(reminder) {
    const query = { _id: reminder.id };
    let newDate = new Date(reminder.notification)
    return this.model.findOneAndUpdate(query, {
      $set: {
        name: reminder.name,
        done: reminder.done,
        notification: reminder.notification,
        month: newDate.getMonth(),
        day: newDate.getDate(),
        time: newDate.toLocaleTimeString('en-US'),
        priority: reminder.priority,
        token: reminder.token
      }
    })
  };

  updateNoteById(note) {
    const query = { _id: note.id };
    let newDate = new Date()
    return this.model.findOneAndUpdate(query, {
      $set: {
        name: note.name,
        time: newDate,
        note: true,
        priority: false
      }
    })
  };
};

module.exports = new ReminderRepository(Reminder);