'use strict';

describe('Controller: FitSettingsCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var FitSettingsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    FitSettingsCtrl = $controller('FitSettingsCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
