var EasypostService = require('../services/easypost-service'),
  FirebaseService = require('../services/firebase-service'),
  Utility = require('../extensions/utility');

var updateLabel = function (shipmentKey) {
  return function (shipment) {
    var deferered = Utility.async(),
      scrubbed = Utility.scrubMissingAttributes(shipment, {removeFunctions: true, removeEmptyStrings: true});

    FirebaseService.getShipment(shipmentKey).child('labels').child(shipment.id).set(scrubbed, function (err) {
      return err ? deferered.reject(err) : deferered.resolve(shipment);
    });

    return deferered.promise;

  };
  
};

module.exports = {
  createAddress: function (req, res) {
    EasypostService.createAddress(req.body).then(EasypostService.verifyAddress).then(function (address) {
      res.json(address);
    }, function (error) {
      res.status(500).send(error);
    });
    
  },

  getAddresses: function (req, res) {
    
  },

  getAddress: function (req, res) {
    
  },

  deleteAddress: function (req, res) {
    
  },

  createParcel: function (req, res) {
    
  },

  getParcel: function (req, res) {
    
  },

  deleteParcel: function (req, res) {
    
  },

  createShipment: function (req, res) {
    EasypostService.createShipment(req.body).then(function (shipment) {
      res.json({shipment: shipment});
    }, function (error) {
      res.status(500).send(error);
    });
  },

  deleteShipment: function (req, res) {
    
  },

  buyShipment: function (req, res) {
    EasypostService.buyShipment(req.params.quoteId, req.params.rateId)
    .then(updateLabel(req.params.shipmentKey))
    .then(function (shipment) {
      res.json({shipment: shipment});
    }, function (error) {
      res.status(500).send(error);
    });

  },

  refundShipment: function (req, res) {
    EasypostService.refundShipment(req.params.labelKey)
    .then(updateLabel(req.params.shipmentKey))
    .then(function (shipment) {
      res.json({shipment: shipment});
    }, function (error) {
      res.status(500).send(error);
    });
  },

  updateTracking: function (req, res) {
    EasypostService.updateTracking(req.params.labelKey, req.body.tracking, req.body.email)
    .then(updateLabel(req.params.shipmentKey))
    .then(function (shipment) {
      res.json({shipment: shipment});
    }, function (error) {
      res.status(500).send(error);
    });
  }

};