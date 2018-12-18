const express = require('express');
const app = express();
const db = require('db');

app.get('/:from/:count', (req, res) => {
	let query = db.getHistory(req.params.from, req.params.count);
	res.submit(query);
});

app.get('/count', (req, res) => {
	let query = db.getHistoryCount();
	res.submit(query);
});

app.get('/date/:date_from/:date_to', (req, res) => {
	let limit_from = parseInt(req.query.limit_from), limit_count = parseInt(req.query.limit_count);

	if(!Number.isInteger(limit_from) || !Number.isInteger(limit_count)) {
		limit_from = 0;
		limit_count = 0;
	}

	let query = db.getHistoryByDate(req.params.date_from, req.params.date_to, limit_from, limit_count);
	res.submit(query);
});

app.get('/date/count/:date_from/:date_to', (req, res) => {
	let query = db.getHistoryCountByDate(req.params.date_from, req.params.date_to);
	res.submit(query);
});

module.exports = app;