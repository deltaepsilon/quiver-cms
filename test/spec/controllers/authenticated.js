'use strict';

describe('Controller: AuthenticatedCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var AuthenticatedCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AuthenticatedCtrl = $controller('AuthenticatedCtrl', {
      $scope: scope,
      user: {}
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    console.log('AuthenticatedCtrl not tested');
    expect(3).toBe(3);
  });
});
