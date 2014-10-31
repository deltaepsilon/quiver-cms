'use strict';

describe('Filter: deSlug', function () {

  // load the filter's module
  beforeEach(module('quiverCmsApp'));

  // initialize a new instance of the filter before each test
  var deSlug;
  beforeEach(inject(function ($filter) {
    deSlug = $filter('deSlug');
  }));

  it('should remove dashes and file type suffixes', function () {
    expect(deSlug('this-is-a-slug.js')).toBe('this is a slug');
  });

});
