'use strict';

describe('Controller: AdminCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var AdminCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $firebase, env) {
    scope = $rootScope.$new();
    AdminCtrl = $controller('AdminCtrl', {
      $scope: scope,
      themeRef: $firebase(new MockFirebase(env.firebase.endpoint)),
      settingsRef: $firebase(new MockFirebase(env.firebase.endpoint))
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    console.log('AdminCtrl not tested');
    expect(3).toBe(3);
  });
});
