var ConfigService = require('./config-service'),
  easypost = require('node-easypost')(ConfigService.get('private.easypost.key')),
  Utility = require('../extensions/utility');


module.exports = {
  createAddress: function (address, cb) {
    var deferred = Utility.async(cb);

    easypost.Address.create(address, function (err, newAddress) {
      console.log('create err, newAddress', err, newAddress);
      return err ? deferred.reject(err) : deferred.resolve(newAddress);
    });

    return deferred.promise;
  },

  verifyAddress: function (address, cb) {
    var deferred = Utility.async(cb);

    address.verify(function (err, newAddress) {
      console.log('verify err, newAddress', err, newAddress);
      return err ? deferred.reject(err) : deferred.resolve(newAddress);
    });

    return deferred.promise;
  }

};