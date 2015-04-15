'use strict';

describe('Controller: MessagesListCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var MessagesListCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    MessagesListCtrl = $controller('MessagesListCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
