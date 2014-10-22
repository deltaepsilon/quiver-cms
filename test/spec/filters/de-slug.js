'use strict';

describe('Filter: deSlug', function () {

  // load the filter's module
  beforeEach(module('quiverCmsApp'));

  // initialize a new instance of the filter before each test
  var deSlug;
  beforeEach(inject(function ($filter) {
    deSlug = $filter('deSlug');
  }));

  it('should return the input prefixed with "deSlug filter:"', function () {
    var text = 'angularjs';
    expect(deSlug(text)).toBe('deSlug filter: ' + text);
  });

});
