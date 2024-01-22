const Appointment = require('../models/Appointment');

class AppointmentRepository {

  constructor(model) {
    this.model = model;
  }

  // create a new Reminder
  create(name) {
    const newAppointment = { name, done: false };
    const Appointment = new this.model(newAppointment);
    return Appointment.save();
  }

  // return all Reminders

  findAll() {
    return this.model.find({note:null}
      );
  }

  findAllNotes() {
    return this.model.find({note:true});
  }

  findByTime(currentDate, currentDay, currentTime) {
    console.log("TIME",currentDate)
    return this.model.find({ $and: [ {month: currentDate}, {day: currentDay}, {time:currentTime} ] });
  }


  //find Reminder by the id
  findById(id) {
    return this.model.findById(id);
  }

  // delete Reminder
  deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }


  deleteSelected(selected) {
    // return this.model.deleteMany({ _id: { $in: selected } })
    return this.model.updateMany({ _id: { $in: selected } }, { $set: { isDeleted: true } })
  }

  wipeSelected(selected) {
    // return this.model.deleteMany({ _id: { $in: selected } })
    return this.model.deleteMany({ _id: { $in: selected } }, { $set: { isDeleted: true } })
  }

  completeSelected(selected) {
    return this.model.updateMany({ _id: { $in: selected } }, { $set: { done: true } })
  }


  // update all Reminders
  updateAll() {
    return this.model.updateMany({}, { $set: { done: false } });
  }

  //find Reminder by id and update it
  updateById(id, object) {
    console.log(id, object)
    const query = { _id: id };
    return this.model.findOneAndUpdate(query, { $set: { 
      name: object.name,
      done: object.done,
      notification: object.notification,
      month:object.month,
      time:object.time,
      day:object.day,
      priority: object.priority
    } 
  });
  }

  updateNoteById(id, object) {
    console.log(id, object)
    const query = { _id: id };
    return this.model.findOneAndUpdate(query, { $set: { 
      name: object.name,
    } 
  });
  }

  //find Reminder by id and update priority
  setPriority(id, object) {
    const query = { _id: id };
    return this.model.findOneAndUpdate(query, { $set: { priority: object.priority } });
  }

  //find Reminder by name and update it
  updateByName(name, object) {
    const query = { name: name };
    return this.model.findOneAndUpdate(query, { $set: { name: object.name, done: object.done, notification: object.notification } });
  }
}

module.exports = new AppointmentRepository(Appointment);