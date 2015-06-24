'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ArchivedGalleryCtrl
 * @description
 * # ArchivedGalleryCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('ArchivedGalleryCtrl', function ($scope, gallery, comments) {
    $scope.gallery = gallery;
    $scope.comments = comments;
  });
