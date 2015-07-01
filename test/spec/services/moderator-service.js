'use strict';

describe('Service: moderatorService', function () {

  // load the service's module
  beforeEach(module('quiverCmsApp'));

  // instantiate service
  var moderatorService;
  beforeEach(inject(function (_moderatorService_) {
    moderatorService = _moderatorService_;
  }));

  it('should do something', function () {
    expect(!!moderatorService).toBe(true);
  });

});
