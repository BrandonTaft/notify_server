const Reminders = require('../models/RemindersModel');
const { Expo } = require('expo-server-sdk')
require('dotenv').config()

async function checkForDueNotifications() {
    let time = new Date();
    const currentDate = time.toLocaleDateString('en-US');
    const currentHour = time.getHours();
    const currentMinute = time.getMinutes();

    let remindersDueToday = await Reminders.aggregate([
        { $unwind: "$reminders" },
        { $match: { "reminders.dueDay": currentDate } },
    ]);

    if (remindersDueToday.length > 0) {
        console.log("Reminders due today are : ", remindersDueToday)
    } else {
        console.log("There are no reminders due today!")
    };

    let remindersDueThisMinute = remindersDueToday.filter((item) => {
        return (
            item.reminders.dueTime.hours === currentHour
            &&
            item.reminders.dueTime.minutes === currentMinute
            &&
            item.reminders.isDeleted === false
            &&
            item.reminders.isCompleted === false
        )
    });

    if (remindersDueThisMinute.length > 0) {
        let expo = new Expo();
        let messages = [];
        for (let i = 0; i < remindersDueThisMinute.length; i++) {
            let pushToken = remindersDueThisMinute[i].reminders.expoPushToken
            if (!Expo.isExpoPushToken(pushToken)) {
                console.error(`Push token ${pushToken} is not a valid Expo push token`);
            } else {
                messages.push({
                    to: pushToken,
                    sound: 'default',
                    body: remindersDueThisMinute[i].reminders.title
                })
            }
        }
        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];
        (async () => {
            // Send the chunks to the Expo push notification service.
            for (let chunk of chunks) {
                try {
                    let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                    console.log("tickets:", ticketChunk);
                    tickets.push(...ticketChunk);
                } catch (error) {
                    console.error("ticket_errors:", error);
                }
            }
        })();
        
        // The receipts may contain error codes to which you MUST RESPOND.
        let receiptIds = [];
        for (let ticket of tickets) {
            if (ticket.id) {
                receiptIds.push(ticket.id);
            }
        };
        
        let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
        
        (async () => {
            // to retrieve batches of receipts from the Expo service.
            for (let chunk of receiptIdChunks) {
                try {
                    let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
                    // The receipts specify whether Apple or Google successfully received the
                    // notification and information about an error, if one occurred.
                    for (let receiptId in receipts) {
                        let { status, message, details } = receipts[receiptId];
                        if (status === 'ok') {
                            continue;
                        } else if (status === 'error') {
                            console.error(
                                `There was an error sending a notification: ${message}`
                            );
                            if (details && details.error) {
                                console.error(`The error code is ${details.error}`);
                            }
                        }
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        })();
    }
};

module.exports = {
    checkForDueNotifications
};
