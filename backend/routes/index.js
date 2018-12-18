const express = require('express');
const app = express();
const response = require('response'); // response formatter for express [res.send()]

const reader = require('./reader');
const cars = require('./cars');
const users = require('./users');
const history = require('./history');

app.use(response);

// reader api
app.use('/reader', reader);

// cars api
app.use('/car', cars);

// users api
app.use('/user', users);

// history api
app.use('/history', history);

module.exports = app;