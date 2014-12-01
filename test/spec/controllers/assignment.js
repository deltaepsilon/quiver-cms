'use strict';

describe('Controller: AssignmentCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var AssignmentCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AssignmentCtrl = $controller('AssignmentCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
