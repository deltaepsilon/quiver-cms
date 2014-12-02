'use strict';

describe('Controller: AdminSubscriptionCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var AdminSubscriptionCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AdminSubscriptionCtrl = $controller('AdminSubscriptionCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
