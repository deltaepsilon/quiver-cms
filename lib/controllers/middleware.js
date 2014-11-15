module.exports = {
	redirect: function (newUrl) {
		return function (req, res) {
			res.redirect(newUrl);
		};
		
	},
	accessControl: function (req, res, next) {
	  if (req.param('access_token')) {
	    req.session.access_token = req.param('access_token');
	  }
	  res.header('Access-Control-Allow-Origin', "*");
	  res.header('Access-Control-Allow-Methods', "GET, POST, PUT, DELETE, PATCH");
	  res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']); // Allow whatever they're asking for
	  next();
	}
}