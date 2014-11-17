var ConfigService = require('./config-service'),
  Mandrill = require('mandrill-api/mandrill').Mandrill,
  mandrill = new Mandrill(ConfigService.get('private.mandrill.apiKey')),
  Utility = require('../extensions/utility.js'),
  app;

module.exports = {
  setApp: function (a) {
    app = a;
  },

  renderTransactionEmail: function (view, context, cb) {
    var deferred = Utility.async(cb);

    app.render(view, context, function (err, content) {
      return err ? deferred.reject(err) : deferred.resolve(content);
    });

    return deferred.promise;
  },

	sendEmail: function (message, cb) {
		var deferred = Utility.async(cb),
      config = ConfigService.get('private.email');

      if (!message.to) {
        message.to = [];
      }
      message.to.concat(config.copy);
      message.from_email = config.from.email;
      message.from_name = config.from.name;
      message.headers = {
        "Reply-To": config.reply
      };
      message.auto_text = true;
      message.auto_html = true;
      message.track_opens = true;

      mandrill.messages.send({message: message}, deferred.resolve, deferred.reject);


		return deferred.promise;
	}
};