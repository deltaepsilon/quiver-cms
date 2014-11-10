'use strict';

describe('Controller: PurchasedCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var PurchasedCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    PurchasedCtrl = $controller('PurchasedCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
