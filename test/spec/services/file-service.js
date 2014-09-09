'use strict';

describe('Service: FileService', function () {

  // load the service's module
  beforeEach(module('quiverCmsApp'));

  // instantiate service
  var FileService;
  beforeEach(inject(function (_FileService_) {
    FileService = _FileService_;
  }));

  it('should do something', function () {
    expect(!!FileService).toBe(true);
  });

});
