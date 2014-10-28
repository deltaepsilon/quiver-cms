'use strict';

describe('Service: CommerceService', function () {

  // load the service's module
  beforeEach(module('quiverCmsApp'));

  // instantiate service
  var CommerceService;
  beforeEach(inject(function (_CommerceService_) {
    CommerceService = _CommerceService_;
  }));

  it('should do something', function () {
    expect(!!CommerceService).toBe(true);
  });

});
