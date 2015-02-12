'use strict';

describe('Service: shipmentService', function () {

  // load the service's module
  beforeEach(module('quiverCmsApp'));

  // instantiate service
  var shipmentService;
  beforeEach(inject(function (_shipmentService_) {
    shipmentService = _shipmentService_;
  }));

  it('should do something', function () {
    expect(!!shipmentService).toBe(true);
  });

});
