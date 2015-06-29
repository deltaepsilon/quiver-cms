var ConfigService = require('../services/config-service'),
    LogService = require('../services/log-service'),
    FirebaseService = require('../services/firebase-service'),
    Firebase = require('firebase'),
    moment = require('moment'),
    firebaseEndpoint = ConfigService.get('public.firebase.endpoint');

module.exports = {
    hydrateUser: function(req, res, next) {
        if (req.method === 'OPTIONS') {
            return next();
        }

        var userToken = req.headers.authorization || req.query.authorization,
            uid = req.headers['uid'] || req.query.uid,
            provider = req.headers['provider'] || req.query.provider,
            email = req.headers.email || req.query.email,
            usersRef = FirebaseService.getUsers(),
            handleAuthError = function(err) {
                LogService.log('userRef auth', err);
                return res.status(401).send({
                    'error': 'Not authorized. uid and authorization headers must be present and valid.'
                });
            },
            hydrate = function(key) {
                req.userRef = new Firebase(firebaseEndpoint + '/users/' + key);
                req.userRef.authWithCustomToken(userToken, function(err, currentUser) {
                    req.userRef.once('value', function(snap) {
                        req.user = snap.val();
                        next();
                    });
                });
            };

        if (!userToken) {
            return res.sendStatus(403);
        }

        FirebaseService.authWithSecret(usersRef).then(function(usersRef) {
            usersRef.orderByChild('email').equalTo(email).once('value', function(snap) {
                var count = snap.numChildren();

                if (count > 1) {
                    LogService.log('Multiple users found in hydrateUser');
                    snap.forEach(function(childSnap) {
                        console.log(childSnap.key());
                    });
                    handleAuthError('Multiple users found');
                } else if (count === 1) {
                    snap.forEach(function(userSnap) {
                        var user = userSnap.val();
                        if (user[provider] && user[provider] === uid) {
                            hydrate(userSnap.key());
                        } else {
                            FirebaseService.authWithSecret(userSnap.ref().child(provider)).then(function(ref) {
                                ref.set(uid, function(err) {
                                    return err ? handleAuthError(err) : hydrate(userSnap.key())
                                });
                            });
                        }

                    });
                } else { // Create new user
                    FirebaseService.firebaseRoot.authWithCustomToken(userToken, function(err, currentUser) {
                        var now = moment(),
                            newUserRef = FirebaseService.getUsers().push()
                        payload = {
                            isAdmin: false,
                            isModerator: false,
                            email: email,
                            preferredEmail: email,
                            created: now.format(),
                            public: {
                                id: newUserRef.key(),
                                preferences: {
                                    marketing: true,
                                    tracking: true
                                }
                            }
                        };

                        if (!currentUser) {
                            console.log('User auth error. currentUser missing');
                            LogService.log('User auth error. currentUser missing');
                            return req.sendStatus(500);
                        }

                        payload[currentUser.provider] = currentUser.uid;

                        FirebaseService.authWithSecret(newUserRef).then(function(ref) {
                            ref.setWithPriority(payload, now.unix(), function(err) {
                                if (err) {
                                    return handleAuthError(err);
                                } else {
                                    hydrate(ref.key());
                                }
                            });
                        });

                    });

                }

            });

        });

    },

    get: function(req, res) {
        var provider = req.params.provider,
            uid = req.params.uid,
            aclRef = FirebaseService.getAcl(uid);

        if (req.user[provider] === uid) {
            FirebaseService.authWithSecret(req.userRef).then(function(userRef) {
                req.userRef.child('lastLogin').set(moment().format());

                if (!req.user.email) {
                    userRef.child('email').set(req.headers.email);
                }

                if (!req.user.preferredEmail) {
                    userRef.child('preferredEmail').set(req.headers.email);
                }
            });

            FirebaseService.authWithSecret(aclRef).then(function(ref) {
                aclRef.set({
                    isAdmin: req.user.isAdmin || false,
                    isModerator: req.user.isModerator || false,
                    permissions: req.user.permissions || false,
                    userKey: req.userRef.key()
                }, function(err) {
                    return err ? LogService.error('ACL set error', err) : true;
                });
            });

            res.json({
                user: req.user,
                key: req.userRef.key()
            });
        } else {
            res.sendStatus(403);
        }
    }

};