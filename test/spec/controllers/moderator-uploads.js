'use strict';

describe('Controller: ModeratorUploadsCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var ModeratorUploadsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ModeratorUploadsCtrl = $controller('ModeratorUploadsCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
