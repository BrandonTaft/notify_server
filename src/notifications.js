const repository = require('../repositories/ReminderRepository');
const { Expo } = require('expo-server-sdk')
require('dotenv').config()

/********************* CHECKS FOR NOTIFICATIONS DUE ********************/
async function checkForNotifications() {
    let data;
    let time = new Date();
    const currentDay = time.getDate();
    const currentDate = time.getMonth();
    const currentTime = time.toLocaleTimeString('en-US')
    data = await repository.findAll()
    let remindersDue = []
for(let i = 0; i < data.length; i++) {
  remindersDue = [...data[i].reminders.filter((item) => item.month === currentDate)]
}
console.log(remindersDue)
   
    if (remindersDue.length > 0) {
        let expo = new Expo();
        let messages = [];
        let pushToken = "ExponentPushToken[im3KBhJ7tf1KH9ZRAGiEOu]"
        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} is not a valid Expo push token`);
        } else {
            messages.push({
                to: remindersDue[0].token,
                sound: 'default',
                body: remindersDue[0].title,
                data: { withSome: 'data' },
            })
        }
        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];
        (async () => {
            // Send the chunks to the Expo push notification service.
            for (let chunk of chunks) {
                try {
                    let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                    console.log(ticketChunk);
                    tickets.push(...ticketChunk);
                } catch (error) {
                    console.error(error);
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
    checkForNotifications,
};
