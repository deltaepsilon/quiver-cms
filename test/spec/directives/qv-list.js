'use strict';

describe('Directive: qvList', function () {

  // load the directive's module
  beforeEach(module('quiverCmsApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<qv-list></qv-list>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the qvList directive');
  }));
});
