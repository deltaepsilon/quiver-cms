'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ShipmentsCtrl
 * @description
 * # ShipmentsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('ShipmentsCtrl', function ($scope, limit, shipmentsRef, AdminService, env) {
    /*
     * Shipments
     */
    var shipments = shipmentsRef.$asArray();
    $scope.shipments = shipments;

    $scope.save = function (shipment) {
      $scope.shipments.$save(shipment);
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
      query({orderByPriority: true, orderByChild: 'code', startAt: term});
    };

    $scope.reset = function () {
      $scope.searching = false;
      $scope.limit = limit;
      $scope.searchTerm = '';
      query();
    };

    /*
     * Shipping
     */
    $scope.shipping = env.shipping;

    $scope.getAddress = function (shipment) {
      var address = '';

      address += shipment.transaction.address.recipient || shipment.user.public.email;
      address += "\n";
      address += shipment.transaction.address.street1 ? shipment.transaction.address.street1 + "\n" : '';
      address += shipment.transaction.address.street2 ? shipment.transaction.address.street2 + "\n" : '';
      address += shipment.transaction.address.street3 ? shipment.transaction.address.street3 + "\n" : '';
      address += shipment.transaction.address.city;
      address += ", ";
      address += shipment.transaction.address.territory || shipment.transaction.address.territoryName;
      address += " ";
      address += shipment.transaction.address.postalCode;
      address += "\n";
      address += shipment.transaction.address.country;

      return address;
    };

    var TRACKING_REGEX = /\$NUMBER/
    $scope.getTracking = function (tracking) {
      var carrier = tracking.carrier,
        number = tracking.number,
        link = $scope.shipping[carrier].link;

      return link.replace(TRACKING_REGEX, number);
    };

  });
