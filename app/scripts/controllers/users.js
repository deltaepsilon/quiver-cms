'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:UsersCtrl
 * @description
 * # UsersCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('UsersCtrl', function ($scope, messageable, AdminService, NotificationService, _) {

    $scope.messageable = messageable;

    $scope.saveUserRoles = function (user) {
      var serverUser = AdminService.getUser(user.$id);

      serverUser.$loaded().then(function () {
        serverUser.isAdmin = user.isAdmin;
        serverUser.isModerator = user.isModerator;

        if (!serverUser.isAdmin) {
          delete serverUser.isAdmin;
        }
        if (!serverUser.isModerator) {
          delete serverUser.isModerator;
        }

        return serverUser.$save();
      }).then(function () {
        NotificationService.success('User saved');
      });

    };

    $scope.saveUserMessageable = function (user) {
      var serverUser = AdminService.getUser(user.$id);

      return serverUser.$loaded().then(function () {
        serverUser.messageable = user.messageable || false;
        return serverUser.$save();
      }).then(function () {
        if (serverUser.messageable) {
          return $scope.messageable.$add({
            userKey: serverUser.$id,
            userName: serverUser.userName || false,
            email: serverUser.email
          });
        } else {
          var user = _.findWhere($scope.messageable, {userKey: serverUser.$id});

          return $scope.messageable.$remove(user);
        }
      }).then(function () {
        NotificationService.success('User saved');
      });

    };

  });
