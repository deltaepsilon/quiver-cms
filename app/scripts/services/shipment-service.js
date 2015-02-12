'use strict';

/**
 * @ngdoc service
 * @name quiverCmsApp.ShipmentService
 * @description
 * # ShipmentService
 * Service in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
  .service('ShipmentService', function (Restangular, env) {
    var easypost = env.easypost;

    return {
      getPredefinedParcel: function () {
        return easypost.predefinedPackages;  
      },

      getDefaultParcel: function () {
        return easypost.predefinedDefault;
      },

      createAddress: function (address) {
        return Restangular.one('admin').one('shipment').one('address').post('create', address);
      }
    }
  });
