'use strict';

describe('Filter: gravatar', function () {

  // load the filter's module
  beforeEach(module('quiverCmsApp'));

  // initialize a new instance of the filter before each test
  var gravatar;
  beforeEach(inject(function ($filter) {
    gravatar = $filter('gravatar');
  }));

  it('should return the input prefixed with "gravatar filter:"', function () {
    var text = 'angularjs';
    expect(gravatar(text)).toBe('gravatar filter: ' + text);
  });

});
