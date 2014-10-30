'use strict';

angular.module('quiverCmsApp')
  .controller('AuthenticatedCtrl', function ($scope, user) {
    $scope.user = user;

    /*
     * Cleanup
    */
    var toDestroy = [user];

    $scope.toDestroy = function (obj) {
      if (obj) {
        toDestroy.push(obj);
      }

    };

    $scope.destroyRefs = function () {
      var i = toDestroy.length;

      while (i--) {
        toDestroy[i].$destroy();
      }
    }

  });
