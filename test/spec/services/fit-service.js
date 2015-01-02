'use strict';

describe('Service: fitService', function () {

  // load the service's module
  beforeEach(module('quiverCmsApp'));

  // instantiate service
  var fitService;
  beforeEach(inject(function (_fitService_) {
    fitService = _fitService_;
  }));

  it('should do something', function () {
    expect(!!fitService).toBe(true);
  });

});
