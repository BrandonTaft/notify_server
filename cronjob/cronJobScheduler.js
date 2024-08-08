'use strict';
const CronJob = require('cron').CronJob;
const notifications = require('./notifications');

function startCronJobScheduler() {
  new CronJob(
    //'0 * * * *', //run every hour
    '00 * * * * *', //run every minute
    () => {
      const time = new Date();
      const currentTime = time.getHours();
      notifications.checkForDueNotifications(currentTime);
    },
    null, // don't run anything after finishing the job
    true, // start the timer
    'America/New_York' // timezone
  );
}

module.exports = {
  startCronJobScheduler,
};