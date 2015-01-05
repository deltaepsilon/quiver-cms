'use strict';

/**
 * @ngdoc filter
 * @name quiverCmsApp.filter:clockTime
 * @function
 * @description
 * # clockTime
 * Filter in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
  .filter('clockTime', function () {
    return function (seconds) {
      var hours = Math.floor(seconds / 3600),
        minutes = Math.floor(seconds % 3600 / 60),
        seconds = Math.round(seconds % 60 * 100)/100,
        pad = function (num) {
          if (num < 10) {
            return '0' + num;
          } else {
            return num;
          }
        },
        result = '';

      if (hours) {
        result += hours + ':';
      }

      result += pad(minutes) + ':' + pad(seconds);
      
      return  result;
    };
  });
