'use strict';

describe('Filter: clockTime', function () {

  // load the filter's module
  beforeEach(module('quiverCmsApp'));

  // initialize a new instance of the filter before each test
  var clockTime;
  beforeEach(inject(function ($filter) {
    clockTime = $filter('clockTime');
  }));

  it('should return the input prefixed with "clockTime filter:"', function () {
    var text = 'angularjs';
    expect(clockTime(text)).toBe('clockTime filter: ' + text);
  });

});
