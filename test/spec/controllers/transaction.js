'use strict';

describe('Controller: TransactionCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var TransactionCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    TransactionCtrl = $controller('TransactionCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
