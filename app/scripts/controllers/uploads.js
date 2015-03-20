'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:UploadsCtrl
 * @description
 * # UploadsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('UploadsCtrl', function ($scope, AdminService) {
    /*
     * Uploads
     */
    $scope.save = function (upload) {
      AdminService.getUpload(upload.$id).$loaded().then(function (serverUpload) {
        serverUpload.comment = upload.comment;
        serverUpload.flag = upload.flag;
        
        if (!serverUpload.comment) {
          delete serverUpload.comment;
        }

        if (!serverUpload.flag) {
          delete serverUpload.flag;
        }

        serverUpload.$save();

      });
    };

    $scope.remove = function (upload) {
      AdminService.getUpload(upload.$id).$remove();
    };

    $scope.flag = function (upload) {
      var flag = (upload.flag || 0) + 1;

      upload.flag = flag <= 3 ? flag : 0;
      $scope.save(upload);
    };


    $scope.searchField = 'userEmail';
    $scope.setSearch = function (term) {
      $scope.searchTerm = term;
    };

  });
