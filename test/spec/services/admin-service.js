'use strict';

describe('Service: AdminService', function () {

  // load the service's module
  beforeEach(module('quiverCmsApp'));

  // instantiate service
  var AdminService;
  beforeEach(inject(function (_AdminService_) {
    AdminService = _AdminService_;
  }));

  it('should do something', function () {
    expect(!!AdminService).toBe(true);
  });

});
