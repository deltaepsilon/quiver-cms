'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ProductsCtrl
 * @description
 * # ProductsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('ProductsCtrl', function ($scope, items, files, Slug, $mdDialog, NotificationService, moment) {

    /*
     * Products
    */
    $scope.items = items;

    // $scope.items.$loaded().then(function (products) {
    //   var i = products.length,
    //     unix = moment().unix();

    //   while (i--) {
    //     products[i].$priority = unix - i;
    //     products.$save(i);
    //   }

    // });

    $scope.orderBy = "-$priority";

    $scope.addProduct = function (newProduct, items) {
        newProduct.slug = Slug.slugify(newProduct.title);
        newProduct.type = 'physical';
        items.$add(newProduct);
        delete $scope.newProduct;
    };

    $scope.confirmRemoveProduct = function (e, item, items) {
      var confirm = $mdDialog.confirm()
        .title(item.title)
        .content('Are you sure you want to eliminate me?')
        .ariaLabel('Delete ' + item.title)
        .ok('Please do it!')
        .cancel("Naah. Let's keep it.")
        .targetEvent(e);

      $mdDialog.show(confirm).then(function() {
        items.$remove(item).then(function () {
          NotificationService.success('Eliminated', item.title);
        }, function (error) {
          NotificationService.error('Something went wrong', error);
        });
      
      }, function() {
        NotificationService.notify('Not eliminated', 'You decided to save ' + item.title + '. How kind!');

      });

    };

    /*
     * Files
    */
    $scope.files = files;


  });
