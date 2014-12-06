var CronJob = require('cron').CronJob,
  Time = require('time'),
  LogService = require('./log-service'),
  FirebaseService = require('./firebase-service'),
  Q = require('q'),
  moment = require('moment'),
  _ = require('underscore');

module.exports = {
  resources: function () {
    var cleanResources = function () {
        var resourcesRef = FirebaseService.getResources();

        resourcesRef.limitToFirst(10).orderByChild('ttl').once('value', function (snap) {
          var resources = snap.val(),
            haveTtl = _.filter(resources, function (resource) {
              return !!resource.ttl;
            }),
            moreToDelete = resources && typeof resources === 'object' ? Object.keys(resources).length === haveTtl.length : 0,
            promises = [],
            now = moment().unix();

          _.each(resources, function (resource, key) {
            if (resource.ttl) {
              var deferred = Q.defer();

              promises.push(deferred.promise);
              if (now - moment(resource.date).unix() > resource.ttl) {
                LogService.info('Cron', 'Removing resource:' + key);
                resourcesRef.child(key).remove(deferred.resolve);
              }

            }            
            
          });

          Q.all(promises).then(function () {
            if (moreToDelete) {
              cleanResources();
            }
            
          });

        });
      },
      job = new CronJob({
        cronTime: '0 0 1 * * *', // Run at 1am America/Denver time
        onTick: cleanResources,
        onComplete: function () {
          LogService.info('Cron', 'Resources cleaned.');
        },
        start: true,
        timeZone: 'America/Denver'
      });

    cleanResources();

  }

}