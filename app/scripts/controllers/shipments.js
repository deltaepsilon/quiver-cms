'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ShipmentsCtrl
 * @description
 * # ShipmentsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('ShipmentsCtrl', function ($scope, $q, $timeout, AdminService, env, CommerceService, NotificationService, ShipmentService, _) {
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

    $scope.forcePrecision = function (value, multiplier) {
      value = Math.round(value * multiplier) / multiplier;
      return value;
    };

    /*
     * Manage shipment
     */
     var verifyDataStructure = function () {
      if (!$scope.$storage.shipment) {
        $scope.$storage.shipment = {};
      }

      if (!$scope.$storage.shipment.customs) {
        $scope.$storage.shipment.customs = {};
      }

      if (!$scope.$storage.shipment.customs.customs_items) {
        $scope.$storage.shipment.customs.customs_items = [];
      }
    };

    $scope.setUnverifiedAddress = function (shipment) {
      var address = shipment.transaction.address;

      $scope.unverifiedAddress = {
        name: address.recipient,
        street1: address.street1,
        street2: address.street2,
        street3: address.street3,
        city: address.city,
        state: address.territory,
        zip: address.postalCode,
        country: address.country,
        email: address.email || shipment.transaction.user.email,
        phone: address.phone

      };

    };


    $scope.selectShipment = function (shipment) {
      verifyDataStructure();

      if ($scope.$storage.shipment.toAddress) {
        delete $scope.$storage.shipment.toAddress;
      }

      $scope.selectedShipment = shipment;
      $scope.setUnverifiedAddress(shipment);
      $scope.createAddress($scope.unverifiedAddress);
      $scope.addCustomsItem(shipment);

    };

    $scope.toggleShipped = function (shipment) {
      if (typeof shipment !== 'object') {
        return console.log('shipment not valid', shipment);
      } else if (!shipment.shipped) {
        shipment.shipped = true;
      } else {
        delete shipment.shipped;
      }

      $scope.save(shipment);

    };

    $scope.createAddress = function (address) {
      return ShipmentService.createAddress(address).then(function (response) {
        if (response.message) {
          NotificationService.notify(response.message);
        }

        if (response.address) {
          verifyDataStructure();
          $scope.$storage.shipment.toAddress = response.address;
        }

      });

    };

    $scope.validateShipment = function (shipment) {
      var parcel = shipment.parcel;

      if (!parcel) {
        return false;
      } else if (!parcel.weight || (!parcel.predefined_package  && (!parcel.length || !parcel.width || !parcel.height || !parcel.weight || !parcel.weight))) {
        return false;
      } else if (!shipment.fromAddress) {
        return false;
      } else if (!shipment.toAddress) {
        return false;
      } else if (!shipment.customs) {
        return false;
      }

      return true;
    }

    $scope.addCustomsItem = function (shipment) {
      verifyDataStructure();

      var item = shipment && shipment.item ? shipment.item : {};
      $scope.$storage.shipment.customs.customs_items.push({
        description: item.title || "",
        quantity: item.quantity || 0,
        weight: item.weight || 0,
        value: item.priceAdjusted || item.price || 0,
        hs_tariff_number: item.hsTariffNumber || "",
        origin_country: item.originCountry || 'US'
      });
    };

    $scope.removeCustomsItem = function (customsItems, index) {
      $timeout(function () { // Need to delay to avoid closing modal
        if (customsItems) {
          customsItems.splice(index, 1);
        }  
      });

    };

    $scope.createShipment = function (newShipment) {
      ShipmentService.createShipment({
        to_address: newShipment.toAddress,
        from_address: newShipment.fromAddress,
        parcel: newShipment.parcel,
        customs_info: newShipment.customs
      }).then(function (response) {
        ShipmentService.saveQuote($scope.selectedShipment.$id, response.shipment);
        NotificationService.success('Shipment created');

      }, function (error) {
        NotificationService.error('Shipment failed', error.data.message.message);
      });
      
    };

    $scope.buyShipment = function (shipment, rate) {
      ShipmentService.buyShipment(shipment.$id, shipment.quote.id, rate.id).then(function (response) {
        NotificationService.success('Purchase successful');
        ShipmentService.removeQuote($scope.selectedShipment.$id);
        console.log('response', response);
      }, function (error) {
        NotificationService.error('Purchase failed', error.data.message);
      });

    };

    $scope.updateTracking = function (shipmentKey, labelKey, tracking, email) {
      ShipmentService.updateTracking(shipmentKey, labelKey, tracking, email).then(function () {
        NotificationService.success('Aftership updated');
      }, function (err) {
        NotificationService.error('Aftership failed', err);
      });
    };

    $scope.refundShipment = function (shipmentKey, labelId) {
      ShipmentService.refundShipment(shipmentKey, labelId).then(function () {
        NotificationService.success('Refund processing');
      }, function (err) {
        NotificationService.error('Refund failed', err);
      });
    };

  });
