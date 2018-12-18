const { spawn } = require('child_process');
const path = require('path');
const logger = new require('logger');
const config = require('config');

const log = new logger('VI89Reader');

class VI89Reader {
	constructor (module_name) {
		let events = {};

		const getEventByNumber = (value) => {
			return Object.keys(this.event).find(key => this.event[key] === value);
		};
		
		const addListener = (event, cb) => {
			let eventName = getEventByNumber(event);
			if(eventName) {
				if(typeof cb === 'function') {
					if(!events[eventName]) {
						events[eventName] = [];
					}

					events[eventName].push(cb);
				}
				else {
					throw log.error(eventName + ' event callback is not a function');
				}
			}
		};

		this.process = null;
		this.IsConnected = false;

		this.event = {
			CONNECTED: 1,
			DISCONNECTED: 2,
			TAG_READED: 4,
			ERROR: 8
		};

		this.fireEvent = (event, data) => {
			let eventName = getEventByNumber(event);

			if(events[eventName]) {
				events[eventName].forEach(item => item(data));
			}
		};

		this.onConnected = (cb) => {
			addListener(this.event.CONNECTED, cb);
		};

		this.onTagReaded = (cb) => {
			addListener(this.event.TAG_READED, cb);
		};

		this.onError = (cb) => {
			addListener(this.event.ERROR, cb);
		};

		this.onDisconnect = (cb) => {
			addListener(this.event.DISCONNECTED, cb);
		};
	}

	connect() {
		let processPath = path.join(__dirname, 'VI89_reader.exe');
		let lastDataTime = 0;
		
		this.process = spawn(processPath, [config.reader.ip, config.reader.port, config.reader.hostIP, config.reader.hostPort]);

		this.process.stdout.on('data', (out) => {
			if(!out) {
				return;
			}

	  		out = out.toString().split(' ');

	  		let cmd = out[0].replace('\r\n', ''), data = '';

	  		if(out[1]) {
	  			data = out[1].replace('\r\n', '');
	  		}

	  		switch(cmd) {
	  			case 'Connected':
	  				this.IsConnected = true;
	  				this.fireEvent(this.event.CONNECTED);
	  				break;

	  			case 'Data':
	  				if((new Date()).getTime() - lastDataTime >= config.reader.readInterval * 1000) {
		  				data = data.split(';');

		  				console.log(data)

		  				for(let i=0; i<data.length; i++) {
							this.fireEvent(this.event.TAG_READED, data[i]);
		  				}
	  				}

	  				break;

	  			case 'Error':
	  				this.fireEvent(this.event.ERROR, data);
	  				this.disconnect();
	  				break;
	  		}
		});

		this.process.on('exit', () => {
			this.disconnect();
		});
	}

	disconnect() {
		this.IsConnected = false;

		this.fireEvent(this.event.DISCONNECTED);
	}

	isConnected() {
		return this.IsConnected;
	}
};

module.exports = new VI89Reader();