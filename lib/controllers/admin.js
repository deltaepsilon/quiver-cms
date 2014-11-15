module.exports = {
	validateAdmin: function (req, res, next) {
		if (req.method !== 'OPTIONS' && (!req.user || !req.user.private || !req.user.private.isAdmin)) {
	    res.sendStatus(401);
	  } else {
	    next();
	  }
  
	}
};