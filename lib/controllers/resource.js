var ObjectService = require('../services/object-service'),
  FirebaseService = require('../services/firebase-service'),
  bf = require('browser_fingerprint'),
  request = require('request'),
  _ = require('underscore'),
  moment = require('moment');

module.exports = {
  resource: function (req, res) {
    var key = req.params.key,
      ip = req.headers['x-forwarded-for'] || req.ip || false,
      cookieString = req.headers.cookie,
      cookies = _.map(cookieString.split('; '), function (cookie) {
        var parts = cookie.split('=');
        return {
          key: parts[0],
          value: parts[1]
        }
      }),
      ga = _.findWhere(cookies, {key: '_ga'});

    ObjectService.getResource(key, function (err, resource) {
      if (err || !resource || !resource.uri) {
        res.sendStatus(404); // Not Found
      } else if (resource.ttl && (moment().unix() - moment(resource.date).unix() > resource.ttl)) {
        res.sendStatus(410); // 410 Gone
      } else {
        req.pipe(request(resource.uri)).pipe(res); // Pipe the stream through

        bf.fingerprint(req, {}, function (fingerprint, elementHash, cookieHash) { // Log stuff
          FirebaseService.getResource(key).child('logs').push().set({
            date: moment().format(),
            ip: ip,
            cookies: cookies,
            ga: ga ? ga.value : false,
            fingerprint: fingerprint
          });
            
        });

      }
      
      
    });
    
  }
};