var Mandrill = require('mandrill-api/mandrill').Mandrill,
  mandrill = new Mandrill(ConfigService.get('private.mandrill.apiKey')),
  Utility = require('../extensions/utility.js');

module.exports = {
	sendEmail: function (params, cb) {
		var deferred = Utility.async(cb);

		deferred.reject('Need to write sendEmail function.');

		return deferred.promise;
	}
};