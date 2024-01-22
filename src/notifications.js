const Appointment = require('../models/Appointment');
const repository = require('../repositories/AppointmentRepository');
const { Expo } = require('expo-server-sdk')
require('dotenv').config()
const { Vonage } = require('@vonage/server-sdk')
const vonage = new Vonage({
    apiKey: "2cb606e4",
    apiSecret: "q7uMAqANqgJCSUtC"
})


/********************* CHECKS FOR ITEMS DUE THIS Time ********************/

async function checkForNotifications() {
    let appointmentsDue;
    let time = new Date();
    const currentDay = time.getDate();
    const currentDate = time.getMonth();
    const currentTime = time.toLocaleTimeString('en-US')
    appointmentsDue = await repository.findByTime(currentDate, currentDay, currentTime)
    if (appointmentsDue.length > 0) {
        
        console.log("Sending", appointmentsDue.length, "Notifications for", currentTime)
        
        let expo = new Expo();
        let messages = [];
        let pushToken = "ExponentPushToken[im3KBhJ7tf1KH9ZRAGiEOu]"
        
        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} is not a valid Expo push token`);
        } else {
            messages.push({
                to: appointmentsDue[0].token,
                sound: 'default',
                body: appointmentsDue[0].name,
                data: { withSome: 'data' },
            })
        }

        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];
        (async () => {
            // Send the chunks to the Expo push notification service. There are
            // different strategies you could use. A simple one is to send one chunk at a
            // time, which nicely spreads the load out over time:
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
        // The receipts may contain error codes to which you must respond. In
        // particular, Apple or Google may block apps that continue to send
        // notifications to devices that have blocked notifications or have uninstalled
        // your app. Expo does not control this policy and sends back the feedback from
        // Apple and Google so you can handle it appropriately.
        let receiptIds = [];
        for (let ticket of tickets) {
            if (ticket.id) {
                receiptIds.push(ticket.id);
            }
        }

        let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
        (async () => {
            // Like sending notifications, there are different strategies you could use
            // to retrieve batches of receipts from the Expo service.
            for (let chunk of receiptIdChunks) {
                try {
                    let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
                    console.log(receipts);

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

/********************* CREATES MESSAGE AND SENDS IT ********************/

//Phone numbers are hard coded in env file for now

async function sendNotification(notification) {
    try {
        console.log(notification)
    } catch (err) {

        console.error(err);
    }
}

module.exports = {
    checkForNotifications,
};
