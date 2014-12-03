'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ShipmentsCtrl
 * @description
 * # ShipmentsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('ShipmentsCtrl', function ($scope, limit, shipmentsRef, AdminService, env, CommerceService, $stateParams, NotificationService, _) {
    /*
     * Shipments
     */
    var shipments = shipmentsRef.$asArray();
    $scope.shipments = shipments;

    $scope.save = function (shipment) {
      

      var userShipmentRef = AdminService.getUserShipment(shipment.transaction.user.public.id, shipment.keys.user);

      userShipmentRef.$set(_.omit(shipment, ['$$hashKey', '$id', '$priority'])).then(function () {
        return $scope.shipments.$save(shipment);
      }).then(function () {
        NotificationService.success('Saved');
      }, function (err) {
        NotificationService.error('Save Failed', err);
      });
      
    };

    /*
     * Query
     */
    var query = function (q) {
      var q = q || {orderByPriority: true, limitToLast: $scope.limit};

      shipmentsRef = AdminService.getShipments(q);
      shipments = shipmentsRef.$asArray();
      shipments.$loaded().then(function (shipments) {
        $scope.shipments = shipments;
      });
    };

    $scope.limit = limit;

    $scope.loadMore = function (increment) {
      $scope.limit += (increment || limit);

      query({orderByPriority: true, limitToLast: $scope.limit});
       
    };

    $scope.search = function (term) {
      $scope.searching = true;
      query({orderByPriority: true, orderByChild: 'email', startAt: term});
    };

    $scope.reset = function () {
      $scope.searching = false;
      $scope.limit = limit;
      $scope.searchTerm = '';
      query();
    };

    shipments.$loaded().then(function () {
      if ($stateParams.search) {
        var term = $stateParams.search;
        $scope.searchTerm = term;
        $scope.search(term);
      }
    });

    /*
     * Shipping
     */
    $scope.shipping = env.shipping;

    $scope.getAddress = CommerceService.getAddress;

    var TRACKING_REGEX = /\$NUMBER/
    $scope.getTracking = function (tracking) {
      var carrier = tracking.carrier,
        number = tracking.number,
        link = $scope.shipping[carrier].link;

      return link.replace(TRACKING_REGEX, number);
    };

  });
