var SocialService = require('../services/social-service');

module.exports = {
	searchInstagram: function (req, res) {
		SocialService.searchInstagram().then(function () {
	    res.sendStatus(200);
	  }, function (err) {
	    res.status(500).send(err);
	  });		
	}
}