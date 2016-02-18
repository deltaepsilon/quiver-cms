var FeedService = require('../services/feed-service');
var RedisService = require('../services/redis-service');
var FirebaseService = require('../services/firebase-service');
var ConfigService = require('../services/config-service');
var LogService = require('../services/log-service');
var Aftership = require('aftership')(ConfigService.get('private.aftership.key'));
var _ = require('underscore');
var Q = require('q');
var url = require('url');


service = {
  feed: function (type) {
    return function (req, res) {
      FeedService.getFeed(function (err, feed) {
        if (err) {
          res.status(500).send(err);
        } else {
          var xml = feed.render('atom-1.0');
          res.status(200).send(xml);
          RedisService.cachePage(req.url, xml)
        }

      });
    }
  },

  atom: function (req, res) {
    service.feed('atom-1.0')(req, res);
  },

  rss: function (req, res) {
    service.feed('rss-2.0')(req, res);
  },

  getFulfillments: function (req, res) {
    var fulfillmentsParts = req.originalUrl.split('/');
    var fulfillmentsPath;

    fulfillmentsParts.splice(fulfillmentsParts.length - 1, 1, 'fulfillments');
    fulfillmentsPath = '/api' + fulfillmentsParts.join('/');

    FirebaseService.authWithSecret(FirebaseService.firebaseRoot)
      .then(function (ref) {
        return FirebaseService.chainFromRef(ref, FirebaseService.getShipments().toString()).orderByChild('shipped').equalTo(null).once('value');
      })
      .then(function (snap) {
        try {
          var shipments = snap.val();
          var combinedShipments = FeedService.combineShipments(shipments);
          var fulfillments = _.map(combinedShipments, FeedService.convertShipmentToFulfillment);
          
          fulfillments.forEach(function (fulfillment) {
            fulfillment.url = url.format({
              protocol: req.protocol,
              host: req.get('host'),
              pathname: fulfillmentsPath + '/' + fulfillment.id + '.json'
            });
          });
          res.json(fulfillments);
        } catch (e) {
          console.log('getFulfillments error in try/catch', e);
          res.status(500).send(e.toString());
        }

      }, function (err) {
        console.log('getFulfillments error', err);
        res.status(500).send(e.toString());
      });
  },

  getFulfillmentsCount: function (req, res) {
    FirebaseService.authWithSecret(FirebaseService.firebaseRoot)
      .then(function (ref) {
        return FirebaseService.chainFromRef(ref, FirebaseService.getShipments().toString()).orderByChild('shipped').equalTo(null).once('value');
      })
      .then(function (snap) {
        res.json({
          count: snap.numChildren()
        });
      }, function (err) {
        console.log('getFulfillmentsCount error', err);
      });
  },

  getFulfillment: function (req, res) {
    var logKeys = req.params.key.split('.')[0].split('|');
    FirebaseService.authWithSecret(FirebaseService.firebaseRoot)
      .then(function (ref) {
        return Q.all(_.map(logKeys, function (key) {
          return FirebaseService.chainFromRef(ref, FirebaseService.getShipment(key).toString()).once('value');
        }));
      })
      .then(function (snaps) {
        res.json(_.map(FeedService.combineShipments(_.map(snaps, function (snap) {
          return snap.val();
        })), FeedService.convertShipmentToFulfillment));
      }, function (err) {
        console.log('getFulfillments error', err);
      });
  },

  updateFulfillment: function (req, res) {
    var lineItems = req.body.order['line-items'];
    var rootRef;
    var rootRegex;
    FirebaseService.authWithSecret(FirebaseService.firebaseRoot)
      .then(function (ref) {
        rootRef = ref;
        rootRegex = new RegExp(rootRef.toString());
        return Q.all(_.map(lineItems, function (lineItem) {
          lineItem = _.map(lineItem, function (item, key) {
            var keys = key.split('|');
            item.keys = {
              log: keys[0],
              user: keys[1]
            };
            return item;
          })[0];
          return FirebaseService.chainFromRef(ref, FirebaseService.getShipment(lineItem.keys.log).toString()).once('value')
            .then(function (snap) {
              return Q({
                ref: snap.ref(),
                shipment: snap.val(),
                update: lineItem
              });
            });
        }));
      })
      .then(function (updates) {
        var paths = _.map(updates, function (update) {
          return update.ref.toString().replace(rootRegex, '');
        });
        var shippedPaths = _.map(paths, function (path) {
          return path + '/shipped';
        });
        var updatePayload = {};

        shippedPaths.forEach(function (path) {
          updatePayload[path] = true;
        });

        return rootRef.update(updatePayload)
          .then(function () {
            updates.paths = paths;
            return Q(updates);
          });
      })
      .then(function (updates) {
        return Q.all(_.map(updates, function (update) {
            return new Q.Promise(function (resolve, reject) {
              var carrierSlug = update.update.carrier.toLowerCase();
              var trackingNumber = update.update.tracking_id;
              var tracking = {
                slug: carrierSlug,
                tracking_number: trackingNumber,
                smses: [update.shipment.transaction.address.phone],
                emails: [update.shipment.transaction.address.email],
                order_id: _.toArray(update.update.keys).join('|'),
                customer_name: update.shipment.transaction.address.recipient
              };

              if (!update.shipment.transaction.address.sms) {
                delete tracking.smses;
              }

              Aftership.call('POST', '/trackings', {
                body: {
                  tracking: tracking
                }
              }, function (err, result) {
                if (!err) {
                  resolve(result);
                } else if (err.code === 4003) { // Tracking already exists.
                  Aftership.call('POST', [
                    '/notifications',
                    carrierSlug,
                    trackingNumber,
                    'add'
                  ].join('/'), {
                    body: {
                      notification: {
                        emails: tracking.emails,
                        smes: tracking.smses
                      }
                    }
                  }, function (err, result) {
                    err ? reject(err) : resolve(result);
                  });
                } else {
                  reject(err);
                }
              });

            });
          }))
          .then(function () {
            return Q(updates);
          });
      })
      .then(function (updates) {
        return Q.all(_.map(updates, function (update) {
            return new Q.Promise(function (resolve, reject) {
              var carrierSlug = update.update.carrier.toLowerCase();
              var trackingNumber = update.update.tracking_id;
              Aftership.call('GET', ['/trackings', carrierSlug, trackingNumber].join('/'), function (err, result) {
                if (err) {
                  if (err.type === 'NotFound') {
                    update.aftership = null;
                    resolve(false)
                  } else {
                    reject(err);
                  }
                } else {
                  update.aftership = result.data;
                  resolve(result);
                }
              });
            });
          }))
          .then(function () {
            return Q(updates);
          });
      })
      .then(function (updates) {
        var labelKey = rootRef.push().key();
        var updatePayload = {};

        _.each(updates, function (update) {
          var path = [
            update.ref.toString().replace(rootRegex, ''),
            'labels',
            labelKey
          ].join('/');
          updatePayload[path] = {
          	tracker: {
          		tracking_code: update.aftership.tracking.tracking_number
          	},
          	aftership: update.aftership
          };
        });
        return rootRef.update(updatePayload)
      })
      .then(function () {
      	res.sendStatus(200);
      })
      .catch(function (err) {
      	var message = 'updateFulfillments error: ' + err.toString();
      	LogService.error(message);
      	LogService.email(message);
        res.status(500).send(err.toString());
      });
  },

  setOrderStatus: function (req, res) {
    var rootRef;
    var rootRegex;
    var status = req.params.status;
    var keys = req.params.key.split('.')[0].split('|');

    FirebaseService.authWithSecret(FirebaseService.firebaseRoot)
      .then(function (ref) {
        rootRef = ref;
        rootRegex = new RegExp(rootRef.toString());
        return Q.all(_.map(keys, function (key) {
          return FirebaseService.getShipment(key).once('value')
            .then(function (snap) {
              if (!snap.val()) {
                res.sendStatus(404);
              } else {
                return Q(FirebaseService.getShipment(key).toString().replace(rootRef, ''));      
              }              
            });
        }));
      })
      .then(function (paths) {
        var updates = {};

        _.each(paths, function (path) {
          updates[path + '/status'] = status;
          updates[path + '/item/fulfillmentStatus'] = status;
          updates[path + '/shipped'] = null;
        });
        
        return rootRef.update(updates);
      })
      .then(function (args) {
        res.sendStatus(200);
      }, function (err) {
        res.status(500).send(err.toString());
      });
  }

};

module.exports = service;