const Organization = require('../models/OrganizationModel');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const salt = 10;
require('dotenv').config()

exports.createOrganization = async (req, res) => {
    const { name, password, isPrivate } = req.body.organization;
    console.log(req.body.organization)
    Organization.findOne({ name: name }).collation({ locale: 'en', strength: 2 })
        .then(async existingOrg => {
            if (existingOrg === null) {
                if (isPrivate) {
                    bcrypt.hash(password, salt, async (error, hash) => {
                        if (error) {
                            res.status(400).json({
                                success: false,
                                message: "Unable to process request",
                                error: error
                            });
                        } else {
                            const newOrg = new Organization({
                                name: name,
                                password: hash,
                                isPrivate: true
                            });
                            let savedOrg = await newOrg.save()
                    if (savedOrg !== null) {
                        res.status(201).json({ success: true, message: "Organization is registered" })
                    }
                            
                        }

                    })
                } else {
                    const newOrg = new Organization({
                        name: name,
                        isPrivate: false
                    });
                    let savedOrg = await newOrg.save()
                    if (savedOrg !== null) {
                        res.status(201).json({ success: true, message: "Organization is registered" })
                    }
                }
                
            } else {
                res.status(200).json({ success: false, message: "That name is taken" });
            }
        })
    // try {
    //   const result = await Reminders.updateOne(
    //     { user_id: userId },
    //     // { $push: { reminders: { reminder_id: reminderId, ...reminder } } },
    //     { $push: { reminders: reminder } },
    //     { "upsert": true }).collation({ locale: 'en', strength: 2 }
    //     )
    //   if (result.upsertedId === null) {
    //     res.status(201).json({ success: true, message: "Reminder was added to existing user" })
    //   } else {
    //     res.status(201).json({ success: true, message: "New User was added with reminder" })
    //   }
    // } catch (error) {
    //   res.status(404).json({ success: false, message: "Unable to complete request", error: error });
    // }
};



exports.getAllOrgs = (req, res) => {
  Organization.find()
    .then(async orgs => {
      res.status(200).json({ success: true, orgs: orgs });
    })
    .catch(() => {
      res.status(404).json({ success: false, message: "Unable to complete request" });
    })
};


// exports.updateById = (req, res) => {
//   const userId = req.body.userId;
//   const updatedReminder = req.body.updatedReminder;
//   Reminders.findOneAndUpdate({ user_id: userId, 'reminders._id': updatedReminder.reminderId },
//     { $set: { "reminders.$": {...updatedReminder, _id: updatedReminder.reminderId } } })
//     .then(async reminder => {
//       if (reminder !== null) {
//         res.status(200).json({ success: true, message: "Reminder has been updated" });
//       } else {
//         res.status(404).json({ success: false, message: "Unable to locate user" });
//       }
//     })
//     .catch(() => {
//       res.status(404).json({ success: false, message: "Unable to locate user" });
//     })
// };

// exports.deleteById = async (req, res) => {
//   const reminderId = req.body.reminderId;
//   const userId = req.body.userId;
//   Reminders.findOneAndUpdate({ user_id: userId }, { $pull: { reminders: { _id: reminderId } } })
//     .then(async user => {
//       res.status(200).json({ success: true, message: "Reminder was deleted" });
//     })
//     .catch(() => {
//       res.status(404).json({ success: false, message: "Unable to locate reminder" });
//     })
// };