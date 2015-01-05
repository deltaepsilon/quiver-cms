'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:FooterCtrl
 * @description
 * # FooterCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('FooterCtrl', function ($scope, filesRef, limit, AdminService, env) {
    /*
     * qv-list
     */
    $scope.filesRef = filesRef;
    $scope.limit = limit;
    $scope.getOriginals = AdminService.getOriginals;
    $scope.bucket = env.amazon.publicBucket;

    /*
     * Query
     */
    $scope.getPrev = function (items) {
      if (items.length) {
        return {orderByChild: 'Index', endAt: (items[0].Index || 0) - 1};  
      } else {
        return 0;
      }
      
    };

    $scope.getNext = function (items) {
      if (items.length) {
        return {orderByChild: 'Index', startAt: (items[items.length - 1].Index || 0) + 1};  
      } else {
        return 10000000000;
      }
      
    };

  });
