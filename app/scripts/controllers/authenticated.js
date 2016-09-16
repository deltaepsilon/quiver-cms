'use strict';

angular.module('quiverCmsApp')
  .controller('AuthenticatedCtrl', function ($scope, user, env, Analytics, $localStorage, $window) {
    $scope.user = user;

    $scope.user.$loaded().then(function (user) {
      if (user && user.public && user.public.preferences && user.public.preferences.tracking) {
        $localStorage.userId = user.$id;
      } else if ($localStorage.userId) {
        delete $localStorage.userId;
      }

      if (user && user.email && env.adRoll && env.adRoll.advId && env.adRoll.pixId) {
        $window.adroll_email = user.email;
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
