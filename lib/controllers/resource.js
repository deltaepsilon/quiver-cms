var ObjectService = require('../services/object-service'),
    FirebaseService = require('../services/firebase-service'),
    ConfigService = require('../services/config-service'),
    LogService = require('../services/log-service'),
    AWSService = require('../services/aws-service'),
    AWS = AWSService.AWS,
    S3 = new AWS.S3(),
    bf = require('browser_fingerprint'),
    request = require('request'),
    _ = require('underscore'),
    moment = require('moment'),
    privateBucket = ConfigService.get('public.amazon.privateBucket');

module.exports = {
    resource: function(req, res) {
        var key = req.params.key,
            ip = req.headers['x-forwarded-for'] || req.ip || false,
            cookieString = req.headers.cookie,
            cookies = _.map(cookieString.split('; '), function(cookie) {
                var parts = cookie.split('=');
                return {
                    key: parts[0],
                    value: parts[1]
                }
            }),
            ga = _.findWhere(cookies, {
                key: '_ga'
            });

        ObjectService.getResource(key, function(err, resource) {
            if (err || !resource || !resource.uri) {
                res.sendStatus(404); // Not Found
            } else if (resource.ttl && (moment().unix() - moment(resource.date).unix() > resource.ttl)) {
                res.sendStatus(410); // 410 Gone
            } else {
                req.pipe(request(resource.uri)).pipe(res); // Pipe the stream through

                bf.fingerprint(req, {}, function(fingerprint, elementHash, cookieHash) { // Log stuff
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

    },
    privateResource: function(req, res) {
        var key = req.path.split('/').slice(4).join('/');
        if (!key) {
            return res.sendStatus(404);
        } else {
            S3.getSignedUrl('getObject', {
                Bucket: privateBucket,
                Key: key,
                Expires: 600
            }, function(err, url) {
                if (err) {
                    LogService.error('Private resource error', err);
                    res.status(500).send(err);
                } else {
                    var resource = request(url);
                    resource.on('response', function(response) {
                        var suffixParts = key.match(/\.(\w*)$/),
                            suffix = suffixParts && suffixParts.length === 2 ? suffixParts[1] : false;
                        if (suffix) {
                            response.headers['Content-Type'] = 'image/' + suffix;
                        }
                        
                        response.headers['Cache-Control'] = 'max-age=31536000';
                        response.headers['Expires'] = moment().add(1, 'year').toDate().toUTCString();
                    });

                    resource.pipe(res);
                }

            });
        }


    }
};