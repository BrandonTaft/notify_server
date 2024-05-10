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
const organizations = require('./routes/OrganizationsRoute');
const scheduler = require('./cronjob/cronJobScheduler');
const chatRoomController = require('./controllers/chatroom.controller');
const app = express();
const http = require("http").Server(app);
const uuidv4 = require('uuid').v4;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const ChatRoom = require('./models/ChatRoomModel');
const Organization = require('./models/OrganizationModel')
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

app.use('/api/reminders', reminders);
app.use('/api/users', users);
app.use('/api/org', organizations);

app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'x-access-token, Content-Type, Authorization, Accept');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
scheduler.startCronJobScheduler();

const orgId = crypto.randomBytes(16).toString("hex");

socketIO.on("connection", (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);
  socket.on("createRoom", ({ roomName, organization, isPrivate }) => {
    chatRoomController.createChatRoom(roomName, organization, isPrivate)
      .then((result) => {
        if(result) {
          ChatRoom.find().then((allRooms) => {
            socketIO.emit("chatRoomList", allRooms);
          })
        }
        socket.join(result._id);
      })
      Organization.findOne({ name: organization }).collation({ locale: 'en', strength: 2 })
      .then(async existingOrg => {
        if (existingOrg === null) {
          const org = new Organization({
           name: organization,
            password: hash,
            organization: organization,
            isLoggedIn: false
        });
        }
      })
  });

  socket.on("findRoom", (roomId) => {
  ChatRoom.findOne({_id: roomId})
  .then(async existingRoom => {
    if(existingRoom) {
      socketIO.emit("foundRoom", existingRoom.messages);
    }
  })
  });

  socket.on("newMessage", (data) => {
    const { roomId, message, user, userId, profileImage, organization, reactions, timestamp } = data;
    const messageId = crypto.randomBytes(16).toString("hex");
    const newMessage = {
      messageId,
      roomId,
      text: message,
      user,
      userId,
      profileImage,
      time: `${timestamp.hour}:${timestamp.mins}`,
      reactions
    };
    ChatRoom.findOne({ _id: roomId })
    .then(async existingChatRoom => {
      if (existingChatRoom) {
        existingChatRoom.messages.push(newMessage)
              existingChatRoom.save();
              socketIO.emit("newMessage",existingChatRoom.messages);
      }
    })
    .then(() => {
      ChatRoom.find().then((chatRooms) => {
        socketIO.emit("chatRoomList", chatRooms)
      })
    })
  });

  socket.on("newReaction", (data) => {
    let { roomId, messageId, reaction } = data;
    ChatRoom.findOneAndUpdate({ _id: roomId, 'messages.messageId': messageId },
    {$inc:{[`messages.$.reactions.${reaction}`]:1}}, {new: true},)
    .then(async result => {
      let message = result.messages.filter((message) => message.messageId === messageId)
      socketIO.emit("newReaction", message[0]);
    })
  });

  socket.on("disconnect", () => {
    socket.disconnect();
    console.log("🔥: A user disconnected");
  });
});

app.get("/api/chatrooms", chatRoomController.getAllChatRooms);

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
