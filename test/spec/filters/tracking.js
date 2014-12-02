'use strict';

describe('Filter: tracking', function () {

  // load the filter's module
  beforeEach(module('quiverCmsApp'));

  // initialize a new instance of the filter before each test
  var tracking;
  beforeEach(inject(function ($filter) {
    tracking = $filter('tracking');
  }));

  it('should return the input prefixed with "tracking filter:"', function () {
    var text = 'angularjs';
    expect(tracking(text)).toBe('tracking filter: ' + text);
  });

});
