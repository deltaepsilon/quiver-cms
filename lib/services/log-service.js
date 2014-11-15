var winston = require('winston'),
		filename = require.main.filename.match(/[^\/]+.js/)[0];

winston.add(winston.transports.File, { filename: './logs/' + filename + '.log'});

module.exports = winston;