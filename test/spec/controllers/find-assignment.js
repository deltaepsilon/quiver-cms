'use strict';

describe('Controller: FindAssignmentCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var FindAssignmentCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    FindAssignmentCtrl = $controller('FindAssignmentCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
