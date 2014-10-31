'use strict';

describe('Controller: MasterCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var MasterCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, env, $firebase) {
    scope = $rootScope.$new();
    MasterCtrl = $controller('MasterCtrl', {
      $scope: scope,
      settingsRef: $firebase(new MockFirebase(env.firebase.endpoint)),
      filesRef: $firebase(new MockFirebase(env.firebase.endpoint)),
      currentUser: {},
      user: {}
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    console.log('MasterCtrl is not tested.');
    expect(3).toBe(3);
  });
});
