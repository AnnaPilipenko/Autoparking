const path = require('path');

class Config {
	constructor() {
		let config = require(path.join(__dirname, '../config.json'));

		return config;
	}
}

module.exports = new Config();