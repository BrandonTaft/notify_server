const repository = require('../repositories/ReminderRepository');
const { Expo } = require('expo-server-sdk')
require('dotenv').config()

async function checkForDueNotifications() {
    let data;
    let time = new Date();
    const currentDay = time.getDate();
    const currentDate = time.getMonth();
    data = await repository.findAll()
    let remindersDue = []
    for (let i = 0; i < data.length; i++) {
        remindersDue = [...data[i].reminders.filter((item) => {
            return (
                item.month === currentDate
                &&
                item.day === currentDay
                &&
                item.isDeleted === false
                &&
                new Date(item.time).setMilliseconds(0) === time.setMilliseconds(0)
            )
        })]
    }

    if (remindersDue.length > 0) {
        let expo = new Expo();
        let messages = [];
        for (let i = 0; i < remindersDue.length; i++) {
            let pushToken = remindersDue[i].token
            if (!Expo.isExpoPushToken(pushToken)) {
                console.error(`Push token ${pushToken} is not a valid Expo push token`);
            } else {
                messages.push({
                    to: pushToken,
                    sound: 'default',
                    body: remindersDue[i].title
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
        }
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
}

module.exports = {
    checkForDueNotifications
};
