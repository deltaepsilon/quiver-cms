'use strict';

angular.module('quiverCmsApp')
  .controller('AccountCtrl', function ($scope, UserService, NotificationService, md5) {
    $scope.user.$bindTo($scope, 'user'); // $scope.user is defined up the scope chain by AuthenticatedCtrl

    $scope.changePassword = function (email, oldPassword, newPassword) {
      delete $scope.oldPassword;
      delete $scope.newPassword;

      UserService.changePassword(email, oldPassword, newPassword).then(function () {
        NotificationService.success('Password Changed');
      }, function (error) {
        NotificationService.error('Error', error.message);
      });
    };

  });
