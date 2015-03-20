'use strict';

angular.module('quiverCmsApp')
  .controller('SocialCtrl', function ($scope, social, instagramTerms, NotificationService, AdminService) {
    /*
     * Social
    */
    social.$bindTo($scope, 'social');

    /*
     * Instagram
    */
    $scope.instagramTerms = instagramTerms;

    $scope.instagramAddTerm = function (term) {
      if (!term) {
        return;
      }

      var term = term.replace(/(#|\s)/g, '').toLowerCase(),
        i = $scope.instagramTerms.length;

      while (i--) {
        if ($scope.instagramTerms[i].$value === term) {
          return NotificationService.error("Term Not Added", "That search term already exists.");
        }
      }

      delete $scope.instagramNewTerm;

      $scope.instagramTerms.$add(term);
    };

    $scope.instagramRemoveTerm = function (i) {
      $scope.instagramTerms.$remove(i);
    };

    $scope.updateInstagram = function () {
      $scope.instagramUpdating = true;
      AdminService.updateInstagram().then(function () {
        delete $scope.instagramUpdating;
        NotificationService.success('Instagram Updated');
      });
    };
  });
