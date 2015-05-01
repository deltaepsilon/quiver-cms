'use strict';

describe('Controller: AdminDashboardCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var AdminDashboardCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AdminDashboardCtrl = $controller('AdminDashboardCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
