'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:AssignmentCtrl
 * @description
 * # AssignmentCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('AssignmentCtrl', function ($scope, productsRef, assignmentRef) {
    /*
     * Assignment
     */
    var assignment = assignmentRef.$asObject();

    assignment.$bindTo($scope, 'assignment');

    /*
     * Products
     */
    $scope.products = productsRef.$asArray();

    $scope.setProduct = function (product, checked) {
      if (!checked) {
        delete $scope.assignment.products[product.slug];
      } 
    }

  });
