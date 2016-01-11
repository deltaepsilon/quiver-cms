module.exports = {
    validateAdmin: function(req, res, next) {
        if (req.method !== 'OPTIONS' && (!req.user || (!req.user.isAdmin && !req.user.isModerator))) {
            res.sendStatus(401);
        } else {
            next();
        }

    }
};