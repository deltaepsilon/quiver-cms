var ConfigService = require('../services/config-service'),
  LogService = require('../services/log-service'),
  FirebaseService = require('../services/firebase-service'),
  Firebase = require('firebase'),
  moment = require('moment'),
  Q = require('q'),
  firebaseEndpoint = ConfigService.get('public.firebase.endpoint');

module.exports = {
  hydrateUser: function (req, res, next) {
    if (req.method === 'OPTIONS') {
      return next();
    }

    var userToken = req.headers.authorization || req.query.authorization,
      uid = req.headers['uid'] || req.query.uid,
      provider = req.headers['provider'] || req.query.provider,
      email = req.headers.email || req.query.email,
      usersRef = FirebaseService.getUsers(),
      handleAuthError = function (err) {
        LogService.log('userRef auth', err);
        return res.status(401).send({
          'error': 'Not authorized. uid and authorization headers must be present and valid.'
        });
      },
      hydrate = function (key) {
        req.userRef = new Firebase(firebaseEndpoint + '/users/' + key);
        req.userRef.authWithCustomToken(userToken, function (err, currentUser) {
          req.userRef.once('value', function (snap) {
            req.user = snap.val();
            next();
          });
        });
      };

    if (!userToken) {
      return res.sendStatus(403);
    }


    if (!email) {
      console.log('email missing for ' + uid, (new Date()).toString());
      LogService.email(['Email missing for ', firebaseEndpoint, '/acl/', uid].join(''));
      // email = uid.replace(/:/, '-') + '@' + ConfigService.get('private.email.from.email').split('@')[1];
    } else {
      email = email.toLowerCase(); // Need to lowercase all of the email. Peeps are inconsistent with their logins.    
      FirebaseService.authWithSecret(usersRef).then(function (usersRef) {
        usersRef.orderByChild('email').equalTo(email).once('value', function (snap) {
          var count = snap.numChildren(),
            setUser = function (userSnap) {
              var user = userSnap.val();
              if (user[provider] && user[provider] === uid) {
                hydrate(userSnap.key());
              } else {
                FirebaseService.authWithSecret(userSnap.ref().child(provider)).then(function (ref) {
                  ref.set(uid, function (err) {
                    return err ? handleAuthError(err) : hydrate(userSnap.key())
                  });
                });
              }
            };

          if (count > 1) {
            /*
             * Handle duplicate users by searching for userKeys from the ACL and picking the first user to be found.
             * Should prioritize user objects with matching ACL entries. This logic is very difficult to test,
             * because I don't yet know why duplicate users are getting created. It's rare, and it's terribly annoying.
             */
            LogService.log('Multiple users found in hydrateUser');
            console.log('Multiple users found timestamp:', moment().format());
            var promises = [],
              userKeys = [],
              aclRef = FirebaseService.firebaseRoot.child('acl');
            snap.forEach(function (childSnap) {
              var aclDeferred = Q.defer(),
                userKey = childSnap.key();

              promises.push(aclDeferred.promise);

              console.log('Multiple users found:', userKey);

              aclRef.orderByChild('userKey').equalTo(userKey).once('value', function (snap) {
                snap.forEach(function (childSnap) {
                  userKeys.push(childSnap.val().userKey);
                });
                aclDeferred.resolve();
              });

            });

            Q.all(promises).then(function () {
              if (userKeys.length) {
                console.log('userKeys', userKeys);
                LogService.email(['Duplicate users found: ', userKeys.join(', ')].join(''));
                snap.forEach(function (childSnap) {
                  if (childSnap.key() === userKeys[0]) { // Default to the first userKey found. There should only be one???
                    setUser(childSnap);
                  }
                });

              } else {
                var errorMessage = 'No userKeys found';
                LogService.log(errorMessage);
                console.log(errorMessage);
                handleAuthError(errorMessage);
              }
            });

          } else if (count === 1) {
            snap.forEach(function (userSnap) {
              setUser(userSnap);
            });
          } else { // Create new user
            FirebaseService.firebaseRoot.authWithCustomToken(userToken, function (err, currentUser) {
              var now = moment(),
                newUserRef = FirebaseService.getUsers().push(),
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

              FirebaseService.authWithSecret(newUserRef).then(function (ref) {
                ref.setWithPriority(payload, now.unix(), function (err) {
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
    }



  },

  get: function (req, res) {
    var provider = req.params.provider,
      uid = req.params.uid,
      aclRef = FirebaseService.getAcl(uid);

    if (req.user[provider] === uid) {
      FirebaseService.authWithSecret(req.userRef).then(function (userRef) {
        req.userRef.child('lastLogin').set(moment().format());

        if (!req.user.email) {
          userRef.child('email').set(req.headers.email);
        }

        if (!req.user.preferredEmail) {
          userRef.child('preferredEmail').set(req.headers.email);
        }
      });

      var attemptCount = 0;
      var setAcl = function () {
        attemptCount += 1;
        FirebaseService.authWithSecret(aclRef).then(function (ref) {
          var acl = {
            isAdmin: req.user.isAdmin || false,
            isModerator: req.user.isModerator || false,
            permissions: req.user.permissions || false,
            userKey: req.userRef.key()
          };

          ref.set(acl, function (err) {
            if (err) {
              LogService.error('ACL set error: ' + JSON.stringify(acl), err, (new Date()).toString(), 'attempt: ' + attemptCount);
              if (attemptCount < 3) {
                setAcl();
              } else {
                LogService.email('ACL auth failed for three tries: ' + JSON.stringify(acl));
              }
            } else {
              // console.log('attemptCount', attemptCount);
            }
          });
        });
      };
      setAcl();

      res.json({
        user: req.user,
        key: req.userRef.key()
      });
    } else {
      res.sendStatus(403);
    }
  }

};