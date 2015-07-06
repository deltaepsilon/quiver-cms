'use strict';

describe('Controller: LogsCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var LogsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    LogsCtrl = $controller('LogsCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
