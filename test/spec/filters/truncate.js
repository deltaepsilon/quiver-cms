'use strict';

describe('Filter: truncate', function () {

  // load the filter's module
  beforeEach(module('quiverCmsApp'));

  // initialize a new instance of the filter before each test
  var truncate;
  beforeEach(inject(function ($filter) {
    truncate = $filter('truncate');
  }));

  it('should return the input prefixed with "truncate filter:"', function () {
    var text = 'angularjs';
    expect(truncate(text)).toBe('truncate filter: ' + text);
  });

});
