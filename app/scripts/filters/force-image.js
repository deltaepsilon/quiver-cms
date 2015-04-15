'use strict';

/**
 * @ngdoc filter
 * @name quiverCmsApp.filter:forceImage
 * @function
 * @description
 * # forceImage
 * Filter in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
  .filter('forceImage', function () {
    return function (url) {
      var suffixParts = url.match(/\.(\w+)$/),
        suffix = suffixParts && suffixParts[1] ? suffixParts[1].toLowerCase() : false;

      switch (suffix) {
        case 'pdf':
          url = '/app/images/sprites/adobe-pdf-icon.png';
          break;
        case 'mp4':
          url = '/app/images/sprites/mdi-av-videocam.png';
          break;
        default:
          break;

      }

      return url;
    };
  });
