var FeedService = require('../services/feed-service');
var RedisService = require('../services/redis-service');
var FirebaseService = require('../services/firebase-service');
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
        }

      }, function (err) {
        console.log('getFulfillments error', err);
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
  	console.log('req.body', req.body);
  	var logKeys = req.params.key.split('.')[0].split('|');
    FirebaseService.authWithSecret(FirebaseService.firebaseRoot)
      .then(function (ref) {
      	return Q.all(_.map(logKeys, function (key) {
      		return FirebaseService.chainFromRef(ref, FirebaseService.getShipment(key).toString()).once('value');	
      	}));
      })
      .then(function (snaps) {
      	res.json(_.map(FeedService.combineShipments(_.map(snaps, function (snap) {
      		// console.log(snap.val());
      		return snap.val();
      	})), FeedService.convertShipmentToFulfillment));
      }, function (err) {
        console.log('getFulfillments error', err);
      });
  }

};

module.exports = service;