const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const reader = require('VI89Reader');
const db = require('db');
const config = require('config');
const routes = require('./routes');

// Connect the routes
app.use(routes);

// Start the server
http.listen(config.server.port, () => {
	console.log(`app listening on port ${config.server.port}!`)
});

// Rise up the reader
reader.connect();
reader.onTagReaded(db.crossReader);
reader.onDisconnect(() => {
	console.log('reader onDisconnect on ' + (new Date().getTime()))
});

// Sockets
io.on('connection', (client) => {
	// db events
	db.addEventListener((name, data) => {
		console.log(name, data)
		client.broadcast.emit(name, data);
	});

	// // reader events
	// reader.onConnected(() => {
	// 	client.emit('reader.status', true);
	// });

	// reader.onDisconnect(() => {
	// 	client.emit('reader.status', false);
	// })
});