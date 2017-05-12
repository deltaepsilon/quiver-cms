'use strict';

/**
 * @ngdoc filter
 * @name quiverCmsApp.filter:filesize
 * @function
 * @description
 * # filesize
 * Filter in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
  .filter('filesize', function () {
    return function (input) {
      var bytes = parseInt(input);

      if (bytes >= 1000000000) { //GB
        return (Math.round(100 * bytes / 100000000) / 100) + 'GB';
      } else if (bytes >= 1000000) { // MB
        return (Math.round(100 * bytes / 1000000) / 100) + 'MB';
      } else if (bytes >= 1000) { // KB
        return (Math.round(100 * bytes / 1000) / 100) + 'KB';
      } else {
        return Math.round(bytes) + 'B';
      }
    };
  });
