'use strict';

describe('Filter: filename', function () {

  // load the filter's module
  beforeEach(module('quiverCmsApp'));

  // initialize a new instance of the filter before each test
  var filename;
  beforeEach(inject(function ($filter) {
    filename = $filter('filename');
  }));

  it('should remove paths and leave just the filename', function () {
    expect(filename("/cms/this-is-a-filename.jpeg")).toBe('this-is-a-filename.jpeg');
  });

});
