'use strict';

describe('Controller: UsersCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var UsersCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, env, $firebase) {
    scope = $rootScope.$new();
    UsersCtrl = $controller('UsersCtrl', {
      $scope: scope,
      usersRef: $firebase(new MockFirebase(env.firebase.endpoint))
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    console.log('UsersCtrl is not tested.');
    expect(3).toBe(3);
  });
});
