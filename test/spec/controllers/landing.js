'use strict';

describe('Controller: LandingCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var LandingCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    LandingCtrl = $controller('LandingCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
