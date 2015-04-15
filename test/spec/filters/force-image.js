'use strict';

describe('Filter: forceImage', function () {

  // load the filter's module
  beforeEach(module('quiverCmsApp'));

  // initialize a new instance of the filter before each test
  var forceImage;
  beforeEach(inject(function ($filter) {
    forceImage = $filter('forceImage');
  }));

  it('should return the input prefixed with "forceImage filter:"', function () {
    var text = 'angularjs';
    expect(forceImage(text)).toBe('forceImage filter: ' + text);
  });

});
