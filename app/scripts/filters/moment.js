'use strict';

/**
 * @ngdoc filter
 * @name quiverCmsApp.filter:moment
 * @function
 * @description
 * # moment
 * Filter in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
  .filter('moment', function (moment) {
    return function (input, pattern) {
      return input ? moment(input).format(pattern) : '';
    };
  });
