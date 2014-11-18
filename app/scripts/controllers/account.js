'use strict';

angular.module('quiverCmsApp')
  .controller('AccountCtrl', function ($scope, qvAuth, NotificationService, moment) {
    $scope.user.$bindTo($scope, 'user'); // $scope.user is defined up the scope chain by AuthenticatedCtrl

    $scope.changePassword = function (email, oldPassword, newPassword) {
      delete $scope.oldPassword;
      delete $scope.newPassword;

      qvAuth.changePassword(email, oldPassword, newPassword).then(function () {
        NotificationService.success('Password Changed');
      }, function (error) {
        NotificationService.error('Error', error.message);
      });
    };

    $scope.$watch('user.public.birthdate', function () {
      if ($scope.user && $scope.user.public && $scope.user.public.birthdate) {
        $scope.birthdate = moment($scope.user.public.birthdate).toDate();
      }

    });

    $scope.setBirthdate = function (birthdate) {
      $scope.user.public.birthdate = moment(birthdate).format();
    };

  });
