const express = require('express');
const app = express();
const db = require('db');
const reader = require('VI89Reader');

// check rader status
app.get('/', (req, res) => {
	res.value = reader.isConnected();
	res.submit();
});


module.exports = app;