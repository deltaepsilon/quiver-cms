var winston = require('winston');
var filename = require.main.filename.match(/[^\/]+.js/)[0];
var EmailService = require('../services/email-service');
var ConfigService = require('../services/config-service');

winston.add(winston.transports.File, { filename: './logs/' + filename + '.log'});

winston.email = function (text) {
  return EmailService.sendEmail({
    text: text,
    to: [{
      email: ConfigService.get('private.email.error_address'),
      name: 'Errors',
      type: 'to'
    }]
  });
};

module.exports = winston;