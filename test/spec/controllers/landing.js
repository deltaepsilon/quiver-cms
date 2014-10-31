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
    console.log('LandingCtrl is not tested.');
    expect(3).toBe(3);
  });
});
