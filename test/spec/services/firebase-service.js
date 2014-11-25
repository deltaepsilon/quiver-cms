'use strict';

describe('Service: firebaseService', function () {

  // load the service's module
  beforeEach(module('quiverCmsApp'));

  // instantiate service
  var firebaseService;
  beforeEach(inject(function (_firebaseService_) {
    firebaseService = _firebaseService_;
  }));

  it('should do something', function () {
    expect(!!firebaseService).toBe(true);
  });

});
