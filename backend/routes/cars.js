const express = require('express');
const app = express();
const db = require('db');

// cars list
app.get('/', (req, res) => {
	let query = db.getCars();
	res.submit(query);
});

// take a car
app.get('/lock/:car_id/:user_id', (req, res) => {
	let query = db.lockCar(req.params.car_id, req.params.user_id);
	res.submit(query);
});

// cancel
app.get('/cancel/:car_id', (req, res) => {
	let query = db.canselReservation(req.params.car_id);
	res.submit(query);
});


module.exports = app;