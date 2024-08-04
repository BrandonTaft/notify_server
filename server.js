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

const { InMemorySessionStore } = require("./sessionStore");
const sessionStore = new InMemorySessionStore();


const socketIO = require('socket.io')(http, {
  cors: {
    origin: "http://192.168.1.26:8081"
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

const randomId = () => crypto.randomBytes(8).toString("hex");

socketIO.use(async (socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  const token = socket.handshake.auth.token;
  console.log("SESSION: ", sessionID, "TOKEN: ", token)
  if (!token) {
    return next(new Error("invalid user id"));
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET_KEY, function (err, decoded) {
      if (!err) {
        if (sessionID) {
          const session = sessionStore.findSession(sessionID);
          console.log("SESSION FOUND :", session)
          if (session) {
            socket.sessionID = sessionID;
            socket.userID = session.userID;
            socket.username = session.username;
            return next();
          } else {
            socket.sessionID = sessionID;
            socket.userID = decoded.id;
            socket.username = decoded.userName
            next();
          }
        }
        const username = socket.handshake.auth.username;
        if (!username) {
          return next(new Error("invalid username"));
        }
        socket.sessionID = randomId();
        socket.userID = socket.handshake.auth.userID;
        socket.username = username
        next();
      } else {
        console.log(token, err)
      }
    });
  } catch (error) {
    console.log(token, error)
  }
});

socketIO.on("connection", (socket) => {
  //if user is logged in but disconnected from socket
  //userController.connectUser(socket.userID)
  console.log("SOMEONE CONNECTED", socket.username)
  User.findOne({ _id: socket.userID })
        .then(async existingUser => {
            console.log("found the user trying to connect", existingUser)
            if (existingUser !== null) {
                existingUser.isLoggedIn = true;
                existingUser.save();
            }
            console.log("saved logged in user", existingUser)
            socketIO.emit("user connected", socket.userID)
        })
  // persist session
  sessionStore.saveSession(socket.sessionID, {
    userID: socket.userID,
    username: socket.username, 
    connected: true,
  });
  const activeUsers = []
for(let [id,socket] of socketIO.of("/").sockets) {
  activeUsers.push({
    socketId: id,
    name: socket.username
  })
}
console.log("activeusers", activeUsers)
  // emit session details
  socket.emit("session", {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });

  // join the "userID" room
  socket.join(socket.userID);

  // notify existing users
  

  //refresh list on client if user logs out/in but never disco'd from server
  socket.on("user logged in", () => {
    socket.broadcast.emit("user connected", socket.userID);
  });

  
  socket.on("newPrivateMessage", async ({ newPrivateMessage }) => {
    socket.to(newPrivateMessage.receiverId).emit("newPrivateMessage", {
      newPrivateMessage: {
        ...newPrivateMessage, fromSelf: false
      }
    });
    userController.updateReceiversPrivateRooms({ ...newPrivateMessage, fromSelf: false })
    userController.updateSendersPrivateRooms(newPrivateMessage)
  });

  socket.on("createRoom", ({ roomId, roomName, ownerId, ownerName, isPrivate, organization }) => {
    chatRoomController.createChatRoom(roomId, roomName, ownerId, ownerName, isPrivate, organization)
      .then((result) => {
        if (result) {
          socket.join(result.roomId);
          ChatRoom.find({ isPrivate: false }).then((allRooms) => {
            socketIO.emit("chatRoomList", allRooms);
          })
        }
        
      })
  });

  socket.on("findRoom", (roomId) => {
    socket.join(roomId)
    ChatRoom.findOne({ roomId: roomId })
      .then(async existingRoom => {
        if (existingRoom) {
          socket.emit("foundRoom", existingRoom.messages);
        }
      })
  });

  socket.on("newMessage", (data) => {
    const { roomId, messageId, text, user, userId, profileImage, reactions, time } = data;
    const newMessage = {
      messageId,
      roomId,
      text,
      user,
      userId,
      profileImage,
      time,
      reactions
    };
    socket.to(roomId).emit("newMessage", newMessage);
    ChatRoom.findOne({ roomId: roomId })
      .then(async existingChatRoom => {
        if (existingChatRoom) {
          existingChatRoom.messages.push(newMessage)
          await existingChatRoom.save();
         // socket.emit("newMessage", existingChatRoom.messages);
        }
        ChatRoom.find({ isPrivate: false }).then((allRooms) => {
          console.log("ALLROOMS", allRooms)
          socket.emit("chatRoomList", allRooms);
        })
      })
  });

  socket.on("newReaction", (data) => {
    let { roomId, messageId, reaction } = data;
    ChatRoom.findOneAndUpdate({ roomId: roomId, 'messages.messageId': messageId },
      { $inc: { [`messages.$.reactions.${reaction}`]: 1 } }, { new: true },)
      .then(async result => {
        let message = result.messages.filter((message) => message.messageId === messageId)
        socket.emit("newReaction", message[0]);
      })
  });


  socket.on("disconnect", async () => {
    console.log("USER DISCONNECTED", socket.username)
    //userController.disconnectUser(socket.userID)
    User.findOne({ _id: socket.userID })
        .then(async existingUser => {
            if (existingUser !== null) {
                existingUser.isLoggedIn = false;
                existingUser.save();
            }
            console.log("saved logged out user", existingUser)
        })
    const matchingSockets = await socket.in(socket.userID).allSockets();
    const isDisconnected = matchingSockets.size === 0;
    if (isDisconnected) {
      // notify other users
      socket.broadcast.emit("user disconnected", socket.userID);
      // update the connection status of the session
      sessionStore.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
        connected: false,
      });
    }
    console.log("activeusers", activeUsers)
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
