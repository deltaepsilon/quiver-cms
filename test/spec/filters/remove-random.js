'use strict';

describe('Filter: removeRandom', function () {

  // load the filter's module
  beforeEach(module('quiverCmsApp'));

  // initialize a new instance of the filter before each test
  var removeRandom;
  beforeEach(inject(function ($filter) {
    removeRandom = $filter('removeRandom');
  }));

  it('should return the input prefixed with "removeRandom filter:"', function () {
    var text = 'angularjs';
    expect(removeRandom(text)).toBe('removeRandom filter: ' + text);
  });

});
