'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:UploadsCtrl
 * @description
 * # UploadsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('UploadsCtrl', function ($scope, limit, uploadsRef, AdminService, $stateParams) {
    /*
     * Uploads
     */
    var uploads = uploadsRef.$asArray();
    $scope.uploads = uploads;

    $scope.save = function (upload) {
      $scope.uploads.$save(upload);
    };

    $scope.flag = function (upload) {
      var flag = (upload.flag || 0) + 1;

      upload.flag = flag <= 3 ? flag : 0;
      $scope.save(upload);
    };

    /*
     * Query
     */
    var query = function (q) {
      var q = q || {orderByPriority: true, limitToLast: $scope.limit};

      uploadsRef = AdminService.getUploads(q);
      uploads = uploadsRef.$asArray();
      uploads.$loaded().then(function (uploads) {
        $scope.uploads = uploads;
      });
    };

    $scope.limit = limit;

    $scope.loadMore = function (increment) {
      $scope.limit += (increment || limit);
      query({orderByPriority: true, limitToLast: $scope.limit});
       
    };

    $scope.loadNext = function (increment) {
      var priority = $scope.uploads[0] ? $scope.uploads[0].$priority : moment().unix();

      query({orderByPriority: true, limitToLast: $scope.limit, endAt: priority - 1});
    };

    $scope.loadPrev = function (increment) {
      var priority = $scope.uploads.length ? $scope.uploads[$scope.uploads.length - 1].$priority : 0;

      query({orderByPriority: true, limitToLast: $scope.limit, startAt: priority + 1});
    };

    $scope.search = function (term) {
      $scope.searching = true;
      query({orderByChild: 'userEmail', equalTo: term});
    };

    $scope.setSearch = function (term) {
      $scope.searchTerm = term;
    $scope.search(term);
    };

    $scope.reset = function () {
      $scope.searching = false;
      $scope.limit = limit;
      $scope.searchTerm = '';
      query();
    };

    uploads.$loaded().then(function () {
      if ($stateParams.search) {
        var term = $stateParams.search;
        $scope.searchTerm = term;
        $scope.search(term);
      }
    });

  });
