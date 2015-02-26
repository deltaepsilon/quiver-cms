'use strict';

angular.module('quiverCmsApp')
  .controller('AuthenticatedCtrl', function ($scope, user, Analytics, $localStorage) {
    $scope.user = user;

    $scope.user.$loaded().then(function (user) {
      if (user && user.public && user.public.preferences && user.public.preferences.tracking) {
        $localStorage.userId = user.$id;
      } else if ($localStorage.userId) {
        delete $localStorage.userId;
      }
      
    });

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
