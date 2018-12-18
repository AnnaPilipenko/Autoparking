const express = require('express');
const app = express();
const db = require('db');

// user list
app.get('/', (req, res) => {
	let query = db.getUsers();
	res.submit(query);
});

module.exports = app;