var ConfigService = require('../services/config-service');

module.exports = {
	env: function (req, res) {
		res.setHeader('Content-Type', 'application/json');
  	res.json(ConfigService.get('public'));
	},

	envJS: function (req, res) {
		res.setHeader('Content-Type', 'application/javascript');
  	res.status(200).send("window.envVars = " + JSON.stringify(ConfigService.get('public')) + ';');
	}
};