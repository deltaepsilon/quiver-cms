var FirebaseService = require('../services/firebase-service'),
    Q = require('q');

module.exports = {
    asked: function(req, res) {
        var key = req.params.key,
            askedRef = key ? FirebaseService.getSettings().child('surveys').child(key).child('asked') : false;

        if (!key) {
            res.sendStatus(500);
        } else {
            askedRef.once('value', function(snap) {
                snap.ref().transaction(function(count) {
                    return (count || 0) + 1;
                }, function(err) {
                    return err ? res.status(500).send(err) : res.sendStatus(200);
                });
            });
        }
    },

    answered: function(req, res) {
        var key = req.params.key,
            answeredRef = key ? FirebaseService.getSettings().child('surveys').child(key).child('answered') : false,
            deferred = Q.defer();

        if (!key) {
            res.sendStatus(500);
        } else {
            answeredRef.once('value', function(snap) {
                snap.ref().transaction(function(count) {
                    return (count || 0) + 1;
                }, function(err) {
                    return err ? deferred.reject(err) : deferred.resolve();
                });
            });
        }

        deferred.promise.then(function() {
            var survey = req.body;

            survey.userId = req.params.userId;
            survey.userEmail = req.user.email;

            FirebaseService.getLogs().child('surveys').push(req.body, function(err) {
                return err ? res.status(500).send(err) : res.sendStatus(200);
            });
        });
    }
};