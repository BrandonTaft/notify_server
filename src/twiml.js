//******* Recieve Message And Send Auto Response ********//

router.get("/sms", async (req, res) => {
    console.log("test", req.query)
    try {
        var to = `+${req.query.msisdn}`;
        var body = req.query.text;
        if (!isNaN(body)) {
            const id = req.session.update;
            const name = req.session.nameToBeUpdated;
            if (body === 1) {
                repository.deleteById(id).then((ok) => {
                    const message = `${name} has been deleted.`
                    sendSMS(to, message);
                    res.status(200).send()
                }).catch((error) => console.log(error));
            } else if (body === 2) {
                const reminder = { done: true };
                repository.updateById(id, reminder).then(() => {
                    const message = `${name} was marked as complete.`
                    const twiml = new MessagingResponse();
                    twiml.message(message);
                    res.writeHead(200, { 'Content-Type': 'text/xml' });
                    res.end(twiml.toString())
                }).catch((error) => console.log(error));
            } else if (body === 3) {
                req.session.update = undefined
                req.session.notify = true
                const message = "When should I Remind you?"
                const twiml = new MessagingResponse();
                twiml.message(message);
                res.writeHead(200, { 'Content-Type': 'text/xml' });
                res.end(twiml.toString())
            } else {
                const message = "Must choose between 1 and 3 "
                const twiml = new MessagingResponse();
                twiml.message(message);
                res.writeHead(200, { 'Content-Type': 'text/xml' });
                res.end(twiml.toString())
            }
        }
        else if (req.session.notify == true) {
            const reminder = { name: req.session.nameToBeUpdated, notification: body };
            var due = moment(reminder.notification,'HH').format('HH:mm');
            repository.updateByName(req.session.nameToBeUpdated, reminder)
            .then(() => {
                const message = `Ok, I will notify you at ${due} `
                const twiml = new MessagingResponse();
                twiml.message(message);
                res.writeHead(200, { 'Content-Type': 'text/xml' });
                res.end(twiml.toString())
                session_destroy();
            }).catch((error) => console.log(error));
        } else {
            //Creates a session to track number of texts from user
            //Sets the reply message depending on how many times user has texted
            const smsCount = req.session.counter || 0;
            let message = `Hello, I've added **${body}** to the list for you!`;
            if (smsCount > 0) {
                message = `Welcome Back! I've added **${body}** to the list for you!`;
            }
            req.session.counter = smsCount + 1;
            finder.findByName(body, function (err, reminders) {
                if (reminders.length === 0) {
                    twimlGenerator.notFound(body)
                    const twiml = new MessagingResponse();
                    twiml.message(message);
                    res.writeHead(200, { 'Content-Type': 'text/xml' });
                    res.end(twiml.toString())
                } else {
                    let update = reminders[0]._id;
                    let nameToBeUpdated = reminders[0].name;
                    req.session.update = update;
                    req.session.nameToBeUpdated = nameToBeUpdated;
                    res.send(twimlGenerator.singleReminder(reminders[0]).toString());
                }
            })
        }
    } catch (error) { console.log(error) };
})
