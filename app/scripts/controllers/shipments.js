'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ShipmentsCtrl
 * @description
 * # ShipmentsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('ShipmentsCtrl', function ($scope, $q, AdminService, env, CommerceService, NotificationService, _) {
    /*
     * Shipments
     */
    
    $scope.save = function (shipment) {
      var userShipmentRef = AdminService.getUserShipment(shipment.transaction.user.public.id, shipment.keys.user);

      userShipmentRef.$set(_.omit(shipment, ['$$hashKey', '$id', '$priority'])).then(function () {        
        return AdminService.getShipment(shipment.$id).$update(_.omit(shipment, ['$$hashKey', '$id', '$priority']));
      }).then(function () {
        NotificationService.success('Saved');
      }, function (err) {
        NotificationService.error('Save Failed', err);
      });
      
    };

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
