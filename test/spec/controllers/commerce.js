'use strict';

describe('Controller: CommerceCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var CommerceCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CommerceCtrl = $controller('CommerceCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
