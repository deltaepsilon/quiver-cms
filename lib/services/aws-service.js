  var AWS = require('aws-sdk'),
  	ConfigService = require('./config-service');

	AWS.config.update(ConfigService.get('private.amazon'));

  module.exports = {
		AWS: AWS
  }