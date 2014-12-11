'use strict';

describe('Controller: MessagesCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var MessagesCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    MessagesCtrl = $controller('MessagesCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
