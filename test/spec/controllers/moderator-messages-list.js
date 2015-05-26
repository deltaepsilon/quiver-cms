'use strict';

describe('Controller: ModeratorMessagesListCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var ModeratorMessagesListCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ModeratorMessagesListCtrl = $controller('ModeratorMessagesListCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
