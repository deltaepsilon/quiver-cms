'use strict';

angular.module('quiverCmsApp')
  .filter('s3Link', function () {
    return function (key, name) {
      return "https://s3.amazonaws.com/" + name + "/" + key ;
    };
  });
