'use strict';

describe('Controller: ModeratorMessagesCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var ModeratorMessagesCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ModeratorMessagesCtrl = $controller('ModeratorMessagesCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
