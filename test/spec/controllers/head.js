'use strict';

describe('Controller: HeadCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var HeadCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    HeadCtrl = $controller('HeadCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
