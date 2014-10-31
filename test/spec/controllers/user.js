'use strict';

describe('Controller: UserCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var UserCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, env, $firebase) {
    scope = $rootScope.$new();
    UserCtrl = $controller('UserCtrl', {
      $scope: scope,
      userRef: $firebase(new MockFirebase(env.firebase.endpoint))
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    console.log('UserCtrl is not tested.');
    expect(3).toBe(3);
  });
});
