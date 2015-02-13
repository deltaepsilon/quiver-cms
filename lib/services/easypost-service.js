var ConfigService = require('./config-service'),
  easypost = require('node-easypost')(ConfigService.get('private.easypost.key')),
  Utility = require('../extensions/utility');


module.exports = {
  createAddress: function (address, cb) {
    var deferred = Utility.async(cb);

    easypost.Address.create(address, function (err, newAddress) {
      return err ? deferred.reject(err) : deferred.resolve(newAddress);
    });

    return deferred.promise;
  },

  verifyAddress: function (address, cb) {
    var deferred = Utility.async(cb);

    address.verify(function (err, newAddress) {
      return err ? deferred.reject(err) : deferred.resolve(newAddress);
    });

    return deferred.promise;
  },

  createShipment: function (shipment, cb) {
    var deferred = Utility.async(cb);

    easypost.Shipment.create(shipment, function (err, newShipment) {
      console.log('err, newShipment', err, newShipment);
      return err ? deferred.reject(err) : deferred.resolve(newShipment);
    });

    return deferred.promise;
  },

  buyShipment: function (shipmentId, rateId, cb) {
    var deferred = Utility.async(cb);

    easypost.Shipment.retrieve(shipmentId, function (err, shipment) {
      shipment.buy({rate: { id: rateId}}, function (err, newShipment) {
        return err ? deferred.reject(err) : deferred.resolve(newShipment);
      });
    });

    return deferred.promise;
  },

  refundShipment: function (shipmentId, cb) {
    var deferred = Utility.async(cb);

    easypost.Shipment.retrieve(shipmentId, function (err, shipment) {
      shipment.refund(function (err, newShipment) {
        return err ? deferred.reject(err) : deferred.resolve(newShipment);
      });
    });

    return deferred.promise;
  }

};