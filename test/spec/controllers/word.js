'use strict';

describe('Controller: WordCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var WordCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    WordCtrl = $controller('WordCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
