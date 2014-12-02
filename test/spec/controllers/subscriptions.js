'use strict';

describe('Controller: SubscriptionsCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var SubscriptionsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    SubscriptionsCtrl = $controller('SubscriptionsCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
