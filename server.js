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
const userController = require('./controllers/user.controller');
const chatRoomController = require('./controllers/chatroom.controller');
const app = express();
const http = require("http").Server(app);
const uuidv4 = require('uuid').v4;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require('./models/UserModel')
const ChatRoom = require('./models/ChatRoomModel');
const Organization = require('./models/OrganizationModel');
const authenticateUser = require('./authMiddleware/auth');
const { rmSync } = require('fs');
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




socketIO.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("invalid user id"));
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET_KEY);
    socket.user = socket.handshake.auth.user;
    next();
  } catch (error) {
    console.log(token, error)
  }
});

const activeUsers = [];

socketIO.on("connection", (socket) => {

  for (let [id, socket] of socketIO.of("/").sockets) {
    let existingActiveUser = activeUsers.find(user => user.user._id === socket.user._id)
    if (existingActiveUser) {
      existingActiveUser.userID = id
    } else {
      activeUsers.push({
        userID: id,
        user: socket.user,
      });
    }
  }
  // socket.emit("users", activeUsers);
  console.log("ActiveUSERS", activeUsers)

  socket.broadcast.emit("user connected", {
    userID: socket.id,
    userName: socket.user.userName,
  });


  socket.on("newPrivateMessage", async ({ newPrivateMessage }) => {
    
    let recipient = await activeUsers.find((user) => user.user._id === newPrivateMessage.receiverId)
    console.log("RECIPEINT",recipient)
    if(recipient) {
    socket.to(recipient.userID).emit("newPrivateMessage", {
      newPrivateMessage: {
        ...newPrivateMessage, fromSelf: false
      }
    });
  } else {
    User.findOne({ _id: receiverId })
    .then(async(user) => {
      if(user) {
          existingRoom = user.privateRooms.find(room => room.recipientId === otherPartyId)
          if(existingRoom){
              existingRoom.messages.push(message)
              user.save();
          } else {
              user.privateRooms.push({recipientId: otherPartyId, recipientName: otherPartyName, messages: [message]})
              user.save();
          }
      }
  })
  }
  });

  socket.on("createRoom", ({ roomId, roomName, ownerId, ownerName, isPrivate, organization }) => {
    chatRoomController.createChatRoom(roomId, roomName, ownerId, ownerName, isPrivate, organization)
      .then((result) => {
        if (result) {
          ChatRoom.find({ isPrivate: false }).then((allRooms) => {
            socketIO.emit("chatRoomList", allRooms);
          })
        }
        socket.join(result.roomId);
      })
  });

  socket.on("findRoom", (roomId) => {
    ChatRoom.findOne({ roomId: roomId })
      .then(async existingRoom => {
        if (existingRoom) {
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
    ChatRoom.findOne({ roomId: roomId })
      .then(async existingChatRoom => {
        if (existingChatRoom) {
          existingChatRoom.messages.push(newMessage)
          await existingChatRoom.save();
          socketIO.emit("newMessage", existingChatRoom.messages);
        }
        ChatRoom.find({ isPrivate: false }).then((allRooms) => {
          console.log("ALLROOMS", allRooms)
          socketIO.emit("chatRoomList", allRooms);
        })
      })
  });
  
  socket.on("newReaction", (data) => {
    let { roomId, messageId, reaction } = data;
    ChatRoom.findOneAndUpdate({ roomId: roomId, 'messages.messageId': messageId },
      { $inc: { [`messages.$.reactions.${reaction}`]: 1 } }, { new: true },)
      .then(async result => {
        let message = result.messages.filter((message) => message.messageId === messageId)
        socketIO.emit("newReaction", message[0]);
      })
  });



  socket.on("disconnect", () => {
    socket.disconnect();
    activeUsers.filter((user) => user.userID === socket.id)
    console.log("USERSSS LEFT", activeUsers)
  });
});



app.get("/api/chatrooms", chatRoomController.getAllChatRooms);

app.post("/api/updateprivateroom", authenticateUser, userController.updatePrivateRoom);

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
