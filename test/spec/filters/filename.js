'use strict';

describe('Filter: filename', function () {

  // load the filter's module
  beforeEach(module('quiverCmsApp'));

  // initialize a new instance of the filter before each test
  var filename;
  beforeEach(inject(function ($filter) {
    filename = $filter('filename');
  }));

  it('should return the input prefixed with "filename filter:"', function () {
    var text = 'angularjs';
    expect(filename(text)).toBe('filename filter: ' + text);
  });

});
