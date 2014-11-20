'use strict';

describe('Controller: UserTransactionCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var UserTransactionCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    UserTransactionCtrl = $controller('UserTransactionCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
