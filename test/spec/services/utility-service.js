'use strict';

describe('Service: utilityService', function () {

  // load the service's module
  beforeEach(module('quiverCmsApp'));

  // instantiate service
  var utilityService;
  beforeEach(inject(function (_utilityService_) {
    utilityService = _utilityService_;
  }));

  it('should do something', function () {
    expect(!!utilityService).toBe(true);
  });

});
