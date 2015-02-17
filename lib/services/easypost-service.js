var ConfigService = require('./config-service'),
  easypost = require('node-easypost')(ConfigService.get('private.easypost.key')),
  Aftership = require('aftership')(ConfigService.get('private.aftership.key')),
  slug = require('slug'),
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
  },

  updateTracking: function (shipmentKey, labelKey, tracking, email, sms, cb) {
    var deferred = Utility.async(cb);

    easypost.Shipment.retrieve(labelKey, function (err, shipment) {
       var carrierSlug = slug(shipment.tracker.carrier).toLowerCase();

       Aftership.getTracking(carrierSlug, tracking, ['tracking_number', 'slug', 'checkpoints'], function (err, result) {
        if (err) {
          if (err.type === 'NotFound') {
            var payload = {
              slug: carrierSlug,
              emails: [email],
              customer_name: shipment.to_address.name,
              smses: ["+" + shipment.to_address.phone],
              order_id: shipmentKey
            };
            if (!sms || !shipment.to_address.phone) {
              delete payload.smses;
            }

            Aftership.createTracking(tracking, payload, function (err, newResult) {
              shipment.aftership = newResult;
              return err ? deferred.reject(err) : deferred.resolve(shipment);
            });

          } else {
            deferred.reject(err);

          }
          
        } else {
          shipment.aftership = Utility.scrubMissingAttributes(result, {removeFunctions: true, removeEmptyStrings: true, removeEmptyObjects: true});
          return err ? deferred.reject(err) : deferred.resolve(shipment); 
          
        }
         
       });
      
    });

    return deferred.promise;
  }

};