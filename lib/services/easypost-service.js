var ConfigService = require('./config-service');
var easypost = require('node-easypost')(ConfigService.get('private.easypost.key'));
var Aftership = require('aftership')(ConfigService.get('private.aftership.key'));
var slug = require('slug');
var Utility = require('../extensions/utility');
var Q = require('q');

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
      return err ? deferred.reject(err) : deferred.resolve(newShipment);
    });

    return deferred.promise;
  },

  buyShipment: function (shipmentId, rateId, cb) {
    var deferred = Utility.async(cb);

    easypost.Shipment.retrieve(shipmentId, function (err, shipment) {
      shipment.buy({
        rate: {
          id: rateId
        }
      }, function (err, newShipment) {
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
  },

  updateTracking: function (shipmentKey, labelKey, trackingNumber, email, sms, cb) {
    return Q.nfcall(easypost.Shipment.retrieve.bind(easypost.Shipment), labelKey)
      .then(function (shipment) {
        var carrierSlug = slug(shipment.tracker.carrier).toLowerCase();
        var tracking = {
          slug: carrierSlug,
          tracking_number: trackingNumber,
          emails: [email],
          customer_name: shipment.to_address.name,
          smses: ["+" + shipment.to_address.phone],
          order_id: shipmentKey
        };
        if (!sms || !shipment.to_address.phone) {
          delete tracking.smses;
        }
        
        return Q.nfcall(Aftership.call.bind(Aftership), 'POST', '/trackings', {
            body: {
              tracking: tracking
            }
          })
          .then(function (result) {
            return Q(shipment);
          }, function (err) {
            if (err.code === 4003) { // Tracking already exists.
              return Q.nfcall(Aftership.call.bind(Aftership), 'POST', [
                '/notifications',
                carrierSlug,
                trackingNumber,
                'add'
              ].join('/'), {
                body: {
                  notification: {
                    emails: tracking.emails,
                    smes: tracking.smses
                  }
                }
              });
            } else {
              return Q.fcall(function () {
                throw new Error(err);
              });
            }
          })
          .then(function () {
            return Q.nfcall(Aftership.call.bind(Aftership), 'GET', [
              '/trackings',
              carrierSlug,
              trackingNumber
            ].join('/'));
          })
          .then(function (result) {
            shipment.aftership = Utility.scrubMissingAttributes(result.data, {
              removeFunctions: true,
              removeEmptyStrings: true,
              removeEmptyObjects: true
            });
            return Q(shipment);
          });
      });
  }

};