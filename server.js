const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const config = require('./config/Config');
const reminders = require('./routes/Reminders');
const app = express();
const http = require("http").Server(app);
const uuidv4 = require('uuid').v4;
require('dotenv').config()

const socketIO = require('socket.io')(http, {
  cors: {
      origin: "<http://192.168.1.26:8081>"
  }
});

const generateID = () => Math.random().toString(36).substring(2, 10);

let chatRooms = [
    //👇🏻 Here is the data structure of each chatroom
    // {
    //  id: generateID(),
    //  name: "Novu Hangouts",
    //  messages: [
    //      {
    //          id: generateID(),
    //          text: "Hello guys, welcome!",
    //          time: "07:50",
    //          user: "Tomer",
    //      },
    //      {
    //          id: generateID(),
    //          text: "Hi Tomer, thank you! 😇",
    //          time: "08:50",
    //          user: "David",
    //      },
    //  ],
    // },
];

//👇🏻 Add this before the app.get() block
socketIO.on("connection", (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);

  socket.on("createRoom", (name) => {
      socket.join(name);
      //👇🏻 Adds the new group name to the chat rooms array
      chatRooms.unshift({ id: generateID(), name, messages: [] });
      //👇🏻 Returns the updated chat rooms via another event
      socket.emit("roomsList", chatRooms);
  });

  socket.on("findRoom", (id) => {
    //👇🏻 Filters the array by the ID
    let result = chatRooms.filter((room) => room.id == id);
    //👇🏻 Sends the messages to the app
    socket.emit("foundRoom", result[0].messages);
  });

  socket.on("newMessage", (data) => {
		const { room_id, message, user, timestamp } = data;
		let result = chatRooms.filter((room) => room.id == room_id);
		const newMessage = {
			id: generateID(),
			text: message,
			user,
			time: `${timestamp.hour}:${timestamp.mins}`,
		};
		console.log("New Message", newMessage);
		socket.to(result[0].name).emit("roomMessage", newMessage);
		result[0].messages.push(newMessage);

		socket.emit("roomsList", chatRooms);
    console.log("foundRoom", result[0].messages)
		socket.emit("foundRoom", result[0].messages);
	});

  socket.on("disconnect", () => {
      socket.disconnect();
      console.log("🔥: A user disconnected");
  });
});

app.get("/api", (req, res) => {
  console.log('chatrooms', chatRooms)
  res.json(chatRooms);
});

mongoose.connect(config.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));





app.use('/', reminders);

//******Catch 404 Errors And Forward To Error Handler*****//
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

//************** Handles And Renders Error Page **************//
app.use(function (err, req, res, next) {
  if (err.status !== 404) {
    console.error(err);
  }
});

// module.exports = app;
http.listen(config.APP_PORT, () => {
	console.log(`Server listening on ${config.APP_PORT}`);
});
