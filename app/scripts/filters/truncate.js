'use strict';

/**
 * @ngdoc filter
 * @name quiverCmsApp.filter:truncate
 * @function
 * @description
 * # truncate
 * Filter in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
  .filter('truncate', function () {
    return function (input, length) {
      if (input.length > length) {
        return input.substr(0, length) + '...';
      } else {
        return input;
      }
      
    };
  });
