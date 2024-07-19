// const express = require('express');
// const path = require('path');
// const mongoose = require('mongoose');
// const multer = require('multer');
// const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');
// const cors = require('cors')
// const config = require('./config/Config');
// const users = require('./routes/UsersRoute');
// const reminders = require('./routes/RemindersRoute');
// const organizations = require('./routes/OrganizationsRoute');
// const scheduler = require('./cronjob/cronJobScheduler');
// const userController = require('./controllers/user.controller');
// const chatRoomController = require('./controllers/chatroom.controller');
// const app = express();
// const http = require("http").Server(app);
// const uuidv4 = require('uuid').v4;
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const crypto = require("crypto");
// const User = require('./models/UserModel')
// const ChatRoom = require('./models/ChatRoomModel');
// const Organization = require('./models/OrganizationModel');
// const authenticateUser = require('./authMiddleware/auth');
// const { rmSync } = require('fs');
// require('dotenv').config();
// const socketIO = require('socket.io')(http, {
//   cors: {
//     origin: "<http://192.168.1.26:8081>"
//   }
// });

// const { InMemorySessionStore } = require("./sessionStore");
// const sessionStore = new InMemorySessionStore();


// mongoose.connect(config.DB, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// app.use(cors());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
// app.use(bodyParser.json());
// app.use(
//   bodyParser.urlencoded({
//     extended: false,
//   })
// );
// app.use(cookieParser());

// app.use('/api/reminders', reminders);
// app.use('/api/users', users);
// app.use('/api/org', organizations);

// app.use((_, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
//   res.setHeader('Access-Control-Allow-Headers', 'x-access-token, Content-Type, Authorization, Accept');
//   next();
// });
// app.use(express.static(path.join(__dirname, 'public')));
// scheduler.startCronJobScheduler();




// socketIO.use( (socket, next) => {
//   const token = socket.handshake.auth.token;
//   const sessionID = socket.handshake.auth.sessionID;
//   console.log("SESSION ID", sessionID)
//   console.log("TOKEN", token)
//   if (!token) {
//     console.log("NO TOKEN")
//     return next(new Error("invalid user id"));
//   }
//   try {
//     jwt.verify(token, process.env.JWT_SECRET_KEY);
//    console.log("CHECKING FOR EXISTING SESSIONS")
//     if (sessionID) {
//       // find existing session
//       const session = sessionStore.findSession(sessionID);
//       if (session) {
//         console.log("FOUND A SESSION", session)
//         socket.sessionID = sessionID;
//         socket.userID = session.userID;
//         socket.username = session.username;
//         return next();
//       }
//     }
//     const username = socket.handshake.auth.username;
//     if (!username) {
//       return next(new Error("invalid username"));
//     }
//     const userID = socket.handshake.auth.userID;
//     if (!userID) {
//       return next(new Error("invalid username"));
//     }
//     // create new session
//     console.log("CREATING NEW SESSION")
//   socket.sessionID = crypto.randomBytes(16).toString("hex");
//   socket.userID = userID;
//   socket.username = username;
//   next();
  
//   } catch (error) {
//     console.log(token, error)
//   }
// });



// socketIO.on("connection", (socket) => {
//  console.log("CONNECTION")
//   socket.emit("session", {
//     sessionID: socket.sessionID,
//     userID: socket.userID,
//   });
 
//  console.log(sessionStore.findAllSessions())
//  socket.join(socket.userID);
 
 
//   let activeUsers = [];
//   for (let [id, socket] of socketIO.of("/").sockets) {
//     let existingActiveUser = activeUsers.find(user => user.user === socket.userID)
//     if (existingActiveUser) {
//       existingActiveUser.userID = id
//     } else {
//       activeUsers.push({
//         userID: id,
//         user: socket.userID,
//       });
//     }
//   }

//   //tells all clients except the socket itself, to refresh list
//   socket.broadcast.emit("user logged in", {
//     userID: socket.id,
//     userName: socket.username,
//   })

//   //refresh list on client if user logs out/in but never disco'd from server
//   socket.on("user logged in", () => {
//     socket.broadcast.emit("user logged in", {
//       userID: socket.id,
//       userName: socket.username,
//     })
//   });

//   //refresh list on client if user logs out/in but never disco'd from server
//   socket.on("user logged out", async (userId) => {
//     activeUsers = activeUsers.filter((user) => user.user._id !== userId)
//     socket.broadcast.emit("user logged out", userId)
//     console.log("ACTIVE USERS",userId, activeUsers)
//   })

//   console.log("ActiveUSERS", activeUsers)


//   socket.on("newPrivateMessage", async ({ newPrivateMessage }) => {
//    let recipient = activeUsers.find((user) => user.user === newPrivateMessage.receiverId)
//    console.log("IDDDD", newPrivateMessage.receiverId, activeUsers.find(({user}) => user === newPrivateMessage.receiverId))
//     if (recipient) {
//       console.log("REC", recipient)
//       socket.to(recipient.userID).to(socket.userID).emit("newPrivateMessage", {
//         newPrivateMessage: {
//           ...newPrivateMessage, fromSelf: false
//         }
//       });
//     } 
//      userController.updateReceiversPrivateRooms(newPrivateMessage)
//      userController.updateSendersPrivateRooms(newPrivateMessage)
//   });

//   socket.on("createRoom", ({ roomId, roomName, ownerId, ownerName, isPrivate, organization }) => {
//     chatRoomController.createChatRoom(roomId, roomName, ownerId, ownerName, isPrivate, organization)
//       .then((result) => {
//         if (result) {
//           ChatRoom.find({ isPrivate: false }).then((allRooms) => {
//             socketIO.emit("chatRoomList", allRooms);
//           })
//         }
//         socket.join(result.roomId);
//       })
//   });

//   socket.on("findRoom", (roomId) => {
//     ChatRoom.findOne({ roomId: roomId })
//       .then(async existingRoom => {
//         if (existingRoom) {
//           socketIO.emit("foundRoom", existingRoom.messages);
//         }
//       })
//   });

//   socket.on("newMessage", (data) => {
//     const { roomId, message, user, userId, profileImage, organization, reactions, timestamp } = data;
//     const messageId = crypto.randomBytes(16).toString("hex");
//     const newMessage = {
//       messageId,
//       roomId,
//       text: message,
//       user,
//       userId,
//       profileImage,
//       time: `${timestamp.hour}:${timestamp.mins}`,
//       reactions
//     };
//     ChatRoom.findOne({ roomId: roomId })
//       .then(async existingChatRoom => {
//         if (existingChatRoom) {
//           existingChatRoom.messages.push(newMessage)
//           await existingChatRoom.save();
//           socketIO.emit("newMessage", existingChatRoom.messages);
//         }
//         ChatRoom.find({ isPrivate: false }).then((allRooms) => {
//           console.log("ALLROOMS", allRooms)
//           socketIO.emit("chatRoomList", allRooms);
//         })
//       })
//   });

//   socket.on("newReaction", (data) => {
//     let { roomId, messageId, reaction } = data;
//     ChatRoom.findOneAndUpdate({ roomId: roomId, 'messages.messageId': messageId },
//       { $inc: { [`messages.$.reactions.${reaction}`]: 1 } }, { new: true },)
//       .then(async result => {
//         let message = result.messages.filter((message) => message.messageId === messageId)
//         socketIO.emit("newReaction", message[0]);
//       })
//   });

//   socket.on("disconnect", async() => {
//     // activeUsers = activeUsers.filter((user) => user.user._id !== socket.userId)
//     // socket.broadcast.emit("user disconnected", socket.username)
//     const matchingSockets = await io.in(socket.userID).allSockets();
//     const isDisconnected = matchingSockets.size === 0;
//     if (isDisconnected) {
//       // notify other users
//       socket.broadcast.emit("user disconnected", socket.userID);
//       // update the connection status of the session
//       sessionStore.saveSession(socket.sessionID, {
//         userID: socket.userID,
//         username: socket.username,
//         connected: false,
//       });
//     }
//   });
//   });



// app.get("/api/chatrooms", chatRoomController.getAllChatRooms);

// app.post("/api/updateprivateroom", authenticateUser, userController.updatePrivateRoom);

// //******Catch 404 Errors And Forward To Error Handler*****//
// app.use(function (req, res, next) {
//   const err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });

// //************** Handles And Renders Error Page **************//
// app.use(function (err, req, res, next) {
//   if (err.status !== 404) {
//     console.error(err);
//   }
// });

// // module.exports = app;
// http.listen(config.APP_PORT, () => {
//   console.log(`Server listening on ${config.APP_PORT}`);
// });
