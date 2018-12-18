/*
	level: 0 = log, 1 = warning, 2 = error
*/

class logger {
	constructor (module_name) {
		this.module_name = module_name;
		this.levels = ['LOG', 'WARN', 'ERR'];
	}

	_print (text, level) {
		if(level >= 0 && level <= 2) {
			let txt = '[' + this.levels[level] + '] ' + this.module_name + ': ' + text;

			console.log(txt);
			return txt;
		}
	}

	log(text) {
		return this._print(text, 0);
	}

	warning(text) {
		return this._print(text, 1);
	}

	error(text) {
		return this._print(text, 2);
	}
};

module.exports = logger;