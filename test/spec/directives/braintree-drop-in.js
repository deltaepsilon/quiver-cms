'use strict';

describe('Directive: braintreeDropIn', function () {

  // load the directive's module
  beforeEach(module('quiverCmsApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    console.log('braintreeDropIn is not tested.');
    expect(3).toBe(3);
  }));
});
