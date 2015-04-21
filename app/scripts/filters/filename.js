'use strict';

angular.module('quiverCmsApp')
  .filter('filename', function () {
    var FILENAME_REGEX = /[^\/]+$/;
    return function (input, map) {
      if (map) {
        var keys = Object.keys(map),
          i = keys.length;

        while (i--) {
          input = input.replace(new RegExp(keys[i], 'g'), map[keys[i]])
        }

      }

      if (!input) {
        console.error('No input found.', map);
        return "";
      } else {
        var matches = input.match(FILENAME_REGEX);
        return (matches && matches.length) ? matches[0] : input;  
      }

      
    };
  });
