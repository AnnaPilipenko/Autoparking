const express = require('express');
const app = express();

app.use((req, res, next) => {
	res.submit = (val) => {
		let obj = {
			status: 0
		};

		if(val && typeof val.then === 'function') {
			val
			.then(out => {
				obj.value = out;
				
				res.send(obj);
			})
			.catch(error => {
				obj.status = 1;
				obj.error = error;

				res.send(obj);
			});
		}
		else {
			// ok
			if(res.value) {
				obj.value = res.value;
			}

			// error
			if(res.error) {
				obj.status = 1;
				obj.error = res.error;
				delete res.value;
			}
			
			res.send(obj);
		}
	};

	next();
});

module.exports = app;