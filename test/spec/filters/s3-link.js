'use strict';

describe('Filter: s3Link', function () {

  // load the filter's module
  beforeEach(module('quiverCmsApp'));

  // initialize a new instance of the filter before each test
  var s3Link;
  beforeEach(inject(function ($filter) {
    s3Link = $filter('s3Link');
  }));

  it('should return the input prefixed with "s3Link filter:"', function () {
    var text = 'angularjs';
    expect(s3Link(text)).toBe('s3Link filter: ' + text);
  });

});
