'use strict';

/**
 * @ngdoc filter
 * @name quiverCmsApp.filter:gravatar
 * @function
 * @description
 * # gravatar
 * Filter in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
  .filter('gravatar', function (md5) {
    return function (email) {
      return 'https://www.gravatar.com/avatar/' + md5.createHash(email);
    };
  });
