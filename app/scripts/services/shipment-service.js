'use strict';

/**
 * @ngdoc service
 * @name quiverCmsApp.ShipmentService
 * @description
 * # ShipmentService
 * Service in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
  .service('ShipmentService', function (Restangular, env, $firebase) {
    var easypost = env.easypost,
      firebaseEndpoint = env.firebase.endpoint;

    return {
      getPredefinedParcel: function () {
        return easypost.predefinedPackages;  
      },

      getDefaultParcel: function () {
        return easypost.predefinedDefault;
      },

      createAddress: function (address) {
        return Restangular.one('admin').one('shipment').one('address').post('create', address);
      },

      createShipment: function (shipment) {
        return Restangular.one('admin').one('shipment').post('create', shipment);
      },

      buyShipment: function (shipmentKey, quoteId, rateId) {
        return Restangular.one('admin').one('shipment').one(shipmentKey).one('quote').one(quoteId).one('rate').one(rateId).post('buy');
      },

      saveQuote: function (shipmentKey, quote) {
        return $firebase(new Firebase(firebaseEndpoint + '/logs/shipments/' + shipmentKey + '/quote')).$set(quote);
      },

      removeQuote: function (shipmentKey) {
        return $firebase(new Firebase(firebaseEndpoint + '/logs/shipments/' + shipmentKey + '/quote')).$remove();
      },

      refundShipment: function (shipmentKey, labelKey) {
        return Restangular.one('admin').one('shipment').one(shipmentKey).one('label').one(labelKey).post('refund');
      },

      updateTracking: function (shipmentKey, labelKey, tracking, email) {
        return Restangular.one('admin').one('shipment').one(shipmentKey).one('label').one(labelKey).post('tracking', {tracking: tracking, email: email});
      }


    }
  });
