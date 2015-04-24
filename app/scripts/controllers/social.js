'use strict';

angular.module('quiverCmsApp')
  .controller('SocialCtrl', function ($scope, $q, social, instagramTerms, NotificationService, AdminService, _) {
    /*
     * Social
    */
    social.$bindTo($scope, 'social');

    /*
     * Instagram
    */
    $scope.instagramTerms = instagramTerms;

    $q.all([social.$loaded(), instagramTerms.$loaded()]).then(function () {
      $scope.terms = [];
      _.each(instagramTerms, function (term) {
        var term = term.$value;
        
        $scope.terms.push({
          term: term,
          meta: social.instagram.results[term].meta,
          pagination: social.instagram.results[term].pagination,
          data: AdminService.getInstagramResults(term)
        });
      });

    });

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

    $scope.removeInstagramResult = function (post, data) {
      data.$remove(post).then(function () {
        NotificationService.success('Removed Instagram result');
      }, function (error) {
        NotificationService.error('Error removing Instagram result', error);
      });

    };

  });
