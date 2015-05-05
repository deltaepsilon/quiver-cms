'use strict';

describe('Controller: LandingPageCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var LandingPageCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    LandingPageCtrl = $controller('LandingPageCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
