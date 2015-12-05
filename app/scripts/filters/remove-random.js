'use strict';

/**
 * @ngdoc filter
 * @name quiverCmsApp.filter:removeRandom
 * @function
 * @description
 * # removeRandom
 * Filter in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
  .filter('removeRandom', function () {
    return function (input) {
      var parts = input.split(':');
      if (parts.length > 1) {
        parts.shift();
      }
      return parts.join(':');
    };
  });
