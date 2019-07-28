'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const client_sessions = require('client-sessions');
const express_device = require('express-device');
const express_fileupload = require('express-fileupload');
const body_parser = require('body-parser');

const chamber = require('./chamber');
const templateEngine = require('./templateEngine');
const main_router = require('./routers/main/router').router;

const PORT = process.env.PORT || 6700;
const app = express();

app.use(express_fileupload({ safeFileNames: true, preserveExtension: true }));
app.use(express_device.capture());
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: false }));
templateEngine.installExpressApp(app);
app.use(client_sessions({
  cookieName: 'session',
  secret: chamber.app_secret,
  duration: 5 * 30 * 60 * 1000,
  activeDuration: 2 * 5 * 60 * 1000,
  cookie: {
	  httpOnly: false,
	  secure: false,
	  ephemeral: false
  }
}));

const server = require('http').createServer(app);
const io = require('socket.io')(server);
const socketConnectionsMap = new Map();

io.on('connection', (socket) => {
  console.log('new socket:', socket);
  socketConnectionsMap.set(socket, socket);
});

app.use(function(request, response, next){
  request.chamber = chamber;
  request.io = io;
  request.socketConnectionsMap = socketConnectionsMap;
  next();
});

app.options('*', cors(chamber.corsOptions));
app.use('/api', cors(chamber.corsOptions), main_router);

/* --- */

//Static file declaration
app.use(express.static(path.join(__dirname, './bin')));
app.use(express.static(path.join(__dirname, './build')));

//production mode
// if(process.env.NODE_ENV === 'production') {
//   app.get('*', (req, res) => {
//     res.sendfile(path.join(__dirname = './build/index.html'));
//   })
// }

// try {
//   app.get('*', (req, res) => {
//     try {
//       res.sendFile(path.join(__dirname, './build/index.html'));
//     } catch(err) {
//       console.log(err);
//       res.json({ error: true, msg: 'could not send file...' });
//     }
//   })
// } catch(e) {
//   console.log(e);
// }

/* --- */


server.listen(PORT);
console.log(`Listening on port ${PORT}...`);
