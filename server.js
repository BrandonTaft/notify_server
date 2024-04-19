const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const config = require('./config/Config');
const users = require('./routes/UsersRoute');
const reminders = require('./routes/RemindersRoute');
const app = express();
const http = require("http").Server(app);
const uuidv4 = require('uuid').v4;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require('dotenv').config();

const socketIO = require('socket.io')(http, {
  cors: {
    origin: "<http://192.168.1.26:8081>"
  }
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
app.use('/api/reminders', reminders);
app.use('/api/users', users);

app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

const generateID = () => Math.random().toString(36).substring(2, 10);

let chatRooms = [];
let organizations = [];

socketIO.on("connection", (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);

  socket.on("createRoom", ({ id, name, organization }) => {

    socket.join(name);

    chatRooms.unshift({ id, name, organization, messages: [] });

    organizations.push({organization, org_id: generateID()})

    const authorizedChatRooms = chatRooms.filter(chatRoom => chatRoom.organization === organization)

    socketIO.emit("chatRoomList", authorizedChatRooms);
  });

  socket.on("findRoom", (id) => {
    //👇🏻 Filters the array by the ID
    let result = chatRooms.filter((room) => room.id == id);
    //👇🏻 Sends the messages to the app
    socketIO.emit("foundRoom", result[0].messages);
  });

  socket.on("newMessage", (data) => {
    console.log("GOT NEW MESSAGE", data)
    const { room_id, message, user, user_id, profile_image, organization,reactions, timestamp } = data;
    let result = chatRooms.filter((room) => room.id == room_id);
    const newMessage = {
      id: generateID(),
      room_id,
      text: message,
      user,
      user_id,
      profile_image,
      time: `${timestamp.hour}:${timestamp.mins}`,
      reactions
    };
    result[0].messages.push(newMessage);
    let authorizedChatRooms = chatRooms.filter((room) => room.organization == organization);
    socketIO.emit("chatRoomList", authorizedChatRooms);
    socketIO.emit("newMessage", result[0].messages);
  });

  socket.on("newReaction", (data) => {
    console.log("GOT NEW Reaction", data)
    const { room_id, id, reaction } = data;
    let room = chatRooms.filter((room) => room.id == room_id);
    let message = room[0].messages.filter((message) => message.id === id)
    if (message[0]) {
      message[0].reactions[reaction]++
    }

    // const newMessage = {
    // 	id: generateID(),
    //   room_id,
    // 	text: message,
    // 	user,
    // 	time: `${timestamp.hour}:${timestamp.mins}`,
    //   reactions
    // };
    // result[0].messages.push(newMessage);
    socketIO.emit("newReaction", message[0]);
    console.log("RESULTS", message[0])
    console.log("CHATROOMS", chatRooms[0].messages)
  });

  socket.on("disconnect", () => {
    socket.disconnect();
    console.log("🔥: A user disconnected");
  });
});

app.get("/chatrooms/:org", (req, res) => {
  console.log("CREDS", req.query)
  console.log("params", req.params)
  console.log('chatrooms', chatRooms)
  let authorizedChatRooms = chatRooms.filter((room) => room.organization == req.params.org);
  res.json(authorizedChatRooms);
});


const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, './public/images');
  },
  filename(req, file, callback) {
    console.log("REQQQ", file)
    callback(null, `${file.originalname}`);
  },
});

const upload = multer({ storage });

app.post('/api/profile-image', upload.single('photo'), (req, res) => {
  console.log('file', req.file);
  console.log('body', req.body.userId);
  res.status(200).json({
    message: 'success!',
  });
});

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
