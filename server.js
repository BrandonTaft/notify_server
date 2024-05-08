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
const scheduler = require('./cronjob/cronJobScheduler');
const chatRoomController = require('./controllers/chatroom.controller');
const app = express();
const http = require("http").Server(app);
const uuidv4 = require('uuid').v4;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const ChatRoom = require('./models/ChatRoomModel');
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

app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'x-access-token, Content-Type, Authorization, Accept');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
scheduler.startCronJobScheduler();


let organizations = [];

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
        //chatRooms.unshift(result);
        // socketIO.emit("chatRoomList", chatRooms);
        socket.join(result._id);
      })

    organizations.push({ organization, org_id: orgId })
    console.log("ORGS", organizations)
  });

  socket.on("findRoom", (roomId) => {
    console.log("IDDDDDD", roomId)
   //console.log("CHATROOOOOOMS", chatRooms)
   // let result = chatRooms.filter((room) => room._id == roomId);
  //  console.log("RESULTTTT", result)
  ChatRoom.findOne({_id: roomId})
  .then(async existingRoom => {
    if(existingRoom) {
      socketIO.emit("foundRoom", existingRoom.messages);
    }
  })
  });

  socket.on("newMessage", (data) => {
    console.log("GOT NEW MESSAGE", data)
    const { roomId, message, user, userId, profileImage, organization, reactions, timestamp } = data;
    // let result = chatRooms.filter((room) => room._id == roomId);
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
    // result[0].messages.push(newMessage);
    // let authorizedChatRooms = chatRooms.filter((room) => room.organization == organization);
    
    // socketIO.emit("chatRoomList", authorizedChatRooms);
    // socketIO.emit("newMessage", result[0].messages);
  });

  socket.on("newReaction", (data) => {
    console.log("GOT NEW Reaction", data)
    let { roomId, messageId, reaction } = data;
    //let room = chatRooms.filter((room) => room.roomId == roomId);
    // ChatRoom.findOne({ _id: roomId }).then((room) => {
    //   let message = room.messages.filter((message) => message.messageId === messageId)
    //   if (message) {
    //     message.reactions[reaction]++
    //   }
    //   socketIO.emit("newReaction", message);
    // })
    ChatRoom.findOneAndUpdate({ _id: roomId, 'messages.messageId': messageId },
      `messages.reactions.${reaction}++` )
    .then(async results => {console.log("RESULLLLT", results)})
    // console.log("RESULTS", message[0])
    // console.log("CHATROOMS", chatRooms[0].messages)
  });

  socket.on("disconnect", () => {
    socket.disconnect();
    console.log("🔥: A user disconnected");
  });
});

app.get("/chatrooms", chatRoomController.getAllChatRooms);

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
