const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const config = require('./config/Config');
const reminders = require('./routes/Reminders');
const app = express();
var expressWs = require('express-ws')(app);
const uuidv4 = require('uuid').v4;



require('dotenv').config()

mongoose.connect(config.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// I'm maintaining all active connections in this object
const clients = {};
// I'm maintaining all active users in this object
const users = {};
// The current editor content is maintained here.
let editorContent = null;
// User activity history.
let userActivity = [];

// Event types
const typesDef = {
  USER_EVENT: 'userevent',
  CONTENT_CHANGE: 'contentchange'
}

function broadcastMessage(json) {
  // We are sending the current data to all connected clients
  const data = JSON.stringify(json);
  for(let userId in clients) {
    let client = clients[userId];
    if(client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  };
}

function handleMessage(message, userId) {
  const dataFromClient = JSON.parse(message.toString());
  const json = { type: dataFromClient.type };
  if (dataFromClient.type === typesDef.USER_EVENT) {
    users[userId] = dataFromClient;
    userActivity.push(`${dataFromClient.username} joined to edit the document`);
    json.data = { users, userActivity };
  } else if (dataFromClient.type === typesDef.CONTENT_CHANGE) {
    editorContent = dataFromClient.content;
    json.data = { editorContent, userActivity };
  }
  broadcastMessage(json);
}

function handleDisconnect(userId) {
    console.log(`${userId} disconnected.`);
    const json = { type: typesDef.USER_EVENT };
    const username = users[userId]?.username || userId;
    userActivity.push(`${username} left the document`);
    json.data = { users, userActivity };
    delete clients[userId];
    delete users[userId];
    broadcastMessage(json);
}

app.ws('/', function(ws, req) {
  // ws.on('message', function(msg) {
  //   console.log(msg);
  // });
  ws.on('message', function(connection) {
    // Generate a unique code for every user
    const userId = uuidv4();
    console.log('Received a new connection', connection);
  
    // Store the new connection and handle messages
    clients[userId] = connection;
    console.log(`${userId} connected.`);
    connection.on('message', (message) => handleMessage(message, userId));
    // User disconnected
    connection.on('close', () => handleDisconnect(userId));
  });
});

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

module.exports = app;
