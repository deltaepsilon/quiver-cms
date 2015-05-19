var LogService = require('./log-service'),
    FirebaseService = require('./firebase-service'),
    ConfigService = require('./config-service'),
    Utility = require('../extensions/utility'),
    moment = require('moment'),
    _ = require('underscore'),
    Q = require('q'),
    request = require('superagent'),
    AWSService = require('./aws-service'),
    AWS = AWSService.AWS,
    S3 = new AWS.S3(),
    publicBucket = ConfigService.get('public.amazon.publicBucket'),
    filePrefix = (ConfigService.get('private.amazon.filePrefix') || 'cms') + '/backup',
    firebaseEndpoint = ConfigService.get('public.firebase.endpoint'),
    firebasePath = firebaseEndpoint.replace(/https?:\/\/[^\/]*/, '');
    firebaseSecret = ConfigService.get('private.firebase.secret');

module.exports = {
    run: function(cb) {
        var deferred = Utility.async(cb),
            requestDeferred = Q.defer();


        request.get(firebaseEndpoint + "/.json?print=pretty&auth=" + firebaseSecret).end(function(err, res) {
            return err ? requestDeferred.reject(err) : requestDeferred.resolve(res.text);
        });

        requestDeferred.promise.then(function(json) {
            S3.putObject({
                Bucket: publicBucket,
                Key: filePrefix + firebasePath + '/' + moment().format() + ".json",
                ACL: 'private',
                Body: json,
                CacheControl: "max-age=34536000",
                Expires: moment().add('10 year').unix(),
                ContentType: 'application/json',
                StorageClass: "REDUCED_REDUNDANCY"
            }, function(err, data) {
                return err ? deferred.reject(err) : deferred.resolve(data);
            });

        });


        return deferred.promise;
    },

    update: function(cb) {
        var deferred = Utility.async(cb),
            s3Deferred = Q.defer();

        S3.listObjects({
            Bucket: publicBucket,
            Prefix: filePrefix
        }, function(err, data) {
            return err ? s3Deferred.reject(err) : s3Deferred.resolve(data);
        });

        s3Deferred.promise.then(function(data) {
            data.Contents = _.each(data.Contents, function(file) {
                var parts = file.Key.split('/');
                file.Filename = parts[parts.length - 1];
            });

            var i = data.Contents.length;

            while (i--) {
                if (!data.Contents[i].Filename.length) {
                    data.Contents.splice(i, 1);
                }
            }

            FirebaseService.getBackups().set(data, function(err) {
                return err ? deferred.reject(err) : deferred.resolve(data);
            });
        }, deferred.reject);

        return deferred.promise;
    },

    getUrl: function(filename) {
        return S3.getSignedUrl('getObject', {
            Bucket: publicBucket,
            Key: filePrefix + firebasePath + '/' + filename
        });
    }
}