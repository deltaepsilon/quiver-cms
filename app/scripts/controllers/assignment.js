'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:AssignmentCtrl
 * @description
 * # AssignmentCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('AssignmentCtrl', function ($scope, products, assignment) {
    /*
     * Assignment
     */
    var assignment = assignment;

    assignment.$bindTo($scope, 'assignment');

    /*
     * Products
     */
    $scope.products = products;

    $scope.setProduct = function (product, checked) {
      if (!checked) {
        delete $scope.assignment.products[product.slug];
      } 
    }

  });
