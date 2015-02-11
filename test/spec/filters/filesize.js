'use strict';

describe('Filter: filesize', function () {

  // load the filter's module
  beforeEach(module('quiverCmsApp'));

  // initialize a new instance of the filter before each test
  var filesize;
  beforeEach(inject(function ($filter) {
    filesize = $filter('filesize');
  }));

  it('should return the input prefixed with "filesize filter:"', function () {
    var text = 'angularjs';
    expect(filesize(text)).toBe('filesize filter: ' + text);
  });

});
