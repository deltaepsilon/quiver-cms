var ConfigService = require('./config-service'),
  FirebaseService = require('./firebase-service'),
  Utility = require('../extensions/utility'),
  Q = require('q'),
  braintree = require('braintree'),
  gateway = braintree.connect({
    environment: braintree.Environment[ConfigService.get('private.braintree.environment') || 'Sandbox'],
    merchantId: ConfigService.get('private.braintree.merchantId'),
    publicKey: ConfigService.get('private.braintree.publicKey'),
    privateKey: ConfigService.get('private.braintree.privateKey')
  }),
  slug = require('slug');

var findCustomer = function (id, cb) {
    var deferred = Utility.async(cb);
    
    gateway.customer.find(slug(id), function (err, customer) {
      return err ? deferred.reject(err) : deferred.resolve(customer);
    });

    return deferred.promise;
  },
  updateCustomer = function (id, customer, cb) {
    var deferred = Utility.async(cb);

    FirebaseService.authWithSecret(FirebaseService.getUser(id).child('private').child('customer')).then(function (ref) {
      ref.set(customer, function (err) {
        return err ? deferred.reject(err) : deferred.resolve(customer);
      });  
    });
    
    return deferred.promise;
    
  };

module.exports = {
  findCustomer: findCustomer,

  updateCustomer: updateCustomer,

  clientToken: function (id, cb) {
    var deferred = Utility.async(cb);

    gateway.clientToken.generate({
      customerId: id
    }, function (err, response) {
      return err ? deferred.reject(err) : deferred.resolve(response);
    }); 
    
    return deferred.promise;
  },

  createCustomer: function (id, email, nonce, first, last, cb) {
    var deferred = Utility.async(cb);

    gateway.customer.create({ 
        id: slug(id),
        email: email,
        firstName: first,
        lastName: last,
        paymentMethodNonce: nonce
      }, function (err, result) {
        return err || !result.success ? deferred.reject(err || result.message) : deferred.resolve(result.customer);
      }); 
    
    return deferred.promise;
  },

  createPaymentMethod: function (id, nonce, cb) {
    var deferred = Utility.async(cb);

    gateway.paymentMethod.create({ 
      customerId: slug(id),
      paymentMethodNonce: nonce
    }, function (err, result) {
      return err || !result.success ? deferred.reject(err || result.message) : deferred.resolve(result.paymentMethod);
    });

    return deferred.promise;    
  },

  deletePaymentMethod: function (token, cb) {
    var deferred = Utility.async(cb);

    gateway.paymentMethod.delete(token, function (err) {
      return err ? deferred.reject(err) : deferred.resolve();
    });

    return deferred.promise;    
  },

  createTransaction: function (transaction, cb) {
    var deferred = Utility.async(cb);

    if (transaction.total) {
      gateway.transaction.sale({
        paymentMethodToken: transaction.paymentToken,
        amount: transaction.total,
        options: {
          submitForSettlement: true
        }
      }, function (err, result) {
        if (err || (result.errors && result.errors.length)) {
          deferred.reject(err);
        } else {
          transaction.charge = result;
          deferred.resolve(transaction);  
        }

      });

    } else {
      transaction.charge = {
        free: true
      };

      deferred.resolve(transaction);  
    }

    return deferred.promise;
  }

};