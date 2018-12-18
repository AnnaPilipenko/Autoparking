const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('logger');
const config = require('config');

const log = new logger('db');

const OPTIONS = {
	db: {
		filename: 'data.db',
		path: '.'
	}
};

// db
class DB {
	constructor () {
		let events = [];

		this._file_path = path.join(__dirname, OPTIONS.db.path, OPTIONS.db.filename);

		this.db = new sqlite3.Database(this._file_path);
		this.addEventListener = (cb) => {
			if(typeof cb === 'function') {
				events.push(cb);
			}
			else {
				throw log.error(eventName + ' event callback is not a function');
			}
		};

		this.fireEvent = (name, data) => {
			events.forEach(item => item(name, data));
		};

		this.crossReader = this.crossReader.bind(this);
	}

	query (sql, params = []) {
		return new Promise((response, reject) => {
			this.db.run(sql, params, (err) => {
				if(err) {
					reject(err);
				}
				else {
					response();
				}
			})
		});
	}

	fetch(sql, params = []) {
		return new Promise((response, reject) => {
			this.db.all(sql, params, (err, rows) => {
				if(err) {
					reject(err);
				}
				else {
					response(rows);
				}
			})
		});
	}

	close () {
		if(typeof this.db === 'object') {
			this.db.close();
		}
	}

	/* users */
	getUsers () {
		return this.fetch('SELECT * FROM users ORDER BY name ASC');
	}

	/* cars */
	lockCar (car_id, user_id) {
		return this.fetch('SELECT COUNT(id) as count FROM cars WHERE active_user_id=?', user_id)
		.then(out => {
			if(out && out.length && out[0].count == 0) {
				return this.fetch('SELECT id, status FROM cars WHERE id=?', car_id);
			}
			else {
				return null;
			}
		})
		.then(out => {
			if(out && out.length && out[0].status == 0) {
				return this.fetch('UPDATE cars SET status=1, active_user_id=? WHERE id=?', [user_id, car_id]);
			}
			else {
				return null;
			}
		})
		.then(out => {
			if(out) {
				return this.fetch('INSERT INTO history (user_id, car_id) VALUES (?, ?)', [user_id, car_id]);
			}
		})
		.then(out => {
			let result = !!out;

			if(result) {
				this.fireEvent('car.reservation', true);
			}
			
			return result;
		});
	}

	canselReservation (car_id) {
		return this.fetch('SELECT * FROM cars WHERE status!=3 AND id=?', car_id)
		.then(out => {
			if(out && out.length) {
				return this.fetch('DELETE FROM history WHERE car_id = ? AND time_out IS NULL AND time_in IS NULL', car_id)
				.then(out => {
					return this.fetch('UPDATE cars SET status=0, active_user_id=0 WHERE status!=3 AND id=?', car_id);
				});
			}
			else {
				return null;
			}
		})
		.then(out => {
			let result = !!out;

			if(result) {
				this.fireEvent('car.reservation', true);
			}
			
			return result;
		});
	}

	getCars () {
		return this.fetch('SELECT cars.*, history.time_out FROM cars LEFT JOIN history ON cars.id = history.car_id AND cars.status = 3 AND history.time_in IS NULL ORDER BY cars.status ASC, cars.brand ASC, cars.model ASC');
	}

	getCarByRFID (val) {
		const sql = 'SELECT * FROM cars WHERE rfid LIKE $rfid or rfid = $rfid_bmw_i3';
		const params = { $rfid: '%' + val + '%', $rfid_bmw_i3: val.substring(0, 8) };

		return this.fetch(sql, params)
		.then(out => {
			if(out && out.length) {
				return out[0];
			}
			else {
				return null;
			}
		});
	}

	/* crossing */
	crossReader(rfid) {
		let timeout = config.reader.checkInterval * 1000;

		let car = null;

		this.getCarByRFID(rfid)
		.then(out => {
			if(out) {
				car = out;

				if(car.active_user_id == 0) {
					this.fetch('SELECT * from history WHERE car_id=? AND time_in IS NULL', [car.id])
					.then(out => {
						if(out && out.length == 0) {
							this.fetch('INSERT INTO history (user_id, car_id) VALUES (0, ?)', [car.id]);
							this.fetch('UPDATE cars SET status=1 WHERE id=?', [car.id]);
						}
					});

					car.status = 1;
					return null;
				}

				switch(car.status) {
					case 1:
						let time_out = new Date().getTime();
						this.fetch('SELECT * from history WHERE car_id=? AND time_out IS NULL', [car.id])
						.then(out => {
							if(out && out.length) {
								this.fireEvent('car.out', { car: car.id, user: car.active_user_id, time_out: time_out });
								return this.query('UPDATE cars SET status=3 WHERE id=?', car.id)
									.then(() => this.query('UPDATE history SET time_out=? WHERE car_id=? AND time_out IS NULL', [time_out, car.id]));
							}
							else {
								return null;
							}
						});

					case 3:
					 this.fetch('SELECT * FROM cars WHERE id=? AND ?-(SELECT time_out FROM history WHERE car_id=? ORDER BY id DESC LIMIT 1) > ?', [car.id, new Date().getTime(), car.id, timeout])
					 .then(out => {
					 	if(out && out.length) {
							this.fireEvent('car.in', { car: car.id });
							return this.query('UPDATE cars SET status=0, active_user_id=0 WHERE id=? AND ?-(SELECT time_out FROM history WHERE car_id=? ORDER BY id DESC LIMIT 1) > ?', [car.id, new Date().getTime(), car.id, timeout])
								.then(() => this.query('UPDATE history SET time_in=? WHERE car_id=? AND time_in IS NULL', [new Date().getTime(), car.id]));
					 	}
					 	else {
					 		return null;
					 	}
					 });
				};

				return null;
			}
		})
		.catch(() => {});
	}

	/* history */
	getHistory(from, count) {
		return this.fetch('SELECT * FROM history ORDER BY id DESC LIMIT ?,?', [from, count]);
	}

	getHistoryByDate(date_from, date_to, limit_from, limit_count) {
		return this.fetch('SELECT * FROM history WHERE time_out>=? AND time_in<=? ORDER BY id DESC LIMIT ?,?', [date_from, date_to, limit_from, limit_count]);
	}

	getHistoryCount() {
		return this.fetch('SELECT COUNT(*) as count FROM history');
	}

	getHistoryCountByDate(date_from, date_to) {
		return this.fetch('SELECT COUNT(*) as count FROM history WHERE time_out>=? AND time_in<=?', [date_from, date_to]);
	}
}

module.exports = new DB();