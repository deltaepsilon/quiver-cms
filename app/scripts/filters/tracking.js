'use strict';

/**
 * @ngdoc filter
 * @name quiverCmsApp.filter:tracking
 * @function
 * @description
 * # tracking
 * Filter in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
  .filter('tracking', function (env) {
    var TRACKING_REGEX = /\$NUMBER/;

    return function (tracking) {
      if (!tracking || !tracking.carrier || !tracking.number) {
        return '';
      } else {
        var carrier = tracking.carrier,
          number = tracking.number,
          carriers = env.shipping.carriers,
          i = carriers.length;

        while(i--) {
          if (carriers[i].code  === carrier) {
            return carriers[i].trackingUrl.replace(TRACKING_REGEX, number);
          }
        }

        return '';

      }

      
    };
  });
