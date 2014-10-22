'use strict';

/**
 * @ngdoc filter
 * @name quiverCmsApp.filter:deSlug
 * @function
 * @description
 * # deSlug
 * Filter in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
  .filter('deSlug', function () {
    var REGEX = /(-|\.\w*$)/g;

    return function (input) {
      return input.replace(REGEX, ' ').trim();
    };
  });
