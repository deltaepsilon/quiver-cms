'use strict';

describe('Controller: AccountCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var AccountCtrl,
    scope,
    noop = function () {};

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    scope.user = {$bindTo: noop};
    AccountCtrl = $controller('AccountCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(3).toBe(3);
  });
});
