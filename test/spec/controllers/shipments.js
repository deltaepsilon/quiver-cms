'use strict';

describe('Controller: ShipmentsCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var ShipmentsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ShipmentsCtrl = $controller('ShipmentsCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
