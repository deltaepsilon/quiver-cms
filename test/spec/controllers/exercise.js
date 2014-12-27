'use strict';

describe('Controller: ExerciseCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var ExerciseCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ExerciseCtrl = $controller('ExerciseCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
