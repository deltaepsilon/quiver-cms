'use strict';

describe('Controller: TestCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var TestCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    TestCtrl = $controller('TestCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(TestCtrl.awesomeThings.length).toBe(3);
  });
});
