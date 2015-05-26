'use strict';

describe('Controller: ModeratorCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var ModeratorCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ModeratorCtrl = $controller('ModeratorCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
