'use strict';

describe('Controller: AdminReportsCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var AdminReportsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AdminReportsCtrl = $controller('AdminReportsCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(AdminReportsCtrl.awesomeThings.length).toBe(3);
  });
});
