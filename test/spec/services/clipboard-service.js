'use strict';

describe('Service: ClipboardService', function () {

  // load the service's module
  beforeEach(module('quiverCmsApp'));

  // instantiate service
  var ClipboardService;
  beforeEach(inject(function (_ClipboardService_) {
    ClipboardService = _ClipboardService_;
  }));

  it('should do something', function () {
    expect(!!ClipboardService).toBe(true);
  });

});
