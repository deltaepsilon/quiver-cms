var EasypostService = require('../services/easypost-service');

module.exports = {
  createAddress: function (req, res) {
    var address = req.body;
    console.log(address);
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
    
  },

  deleteShipment: function (req, res) {
    
  },

  buyShipment: function (req, res) {
    
  },

  refundShipment: function (req, res) {
    
  }

};