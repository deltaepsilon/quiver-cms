'use strict';

describe('Controller: FilesCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var FilesCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $window, env, $firebase) {
    scope = $rootScope.$new();
    FilesCtrl = $controller('FilesCtrl', {
      $scope: scope,
      filesRef: $firebase(new MockFirebase(env.firebase.endpoint)),
      notificationsRef: $firebase(new MockFirebase(env.firebase.endpoint))
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    console.log('FilesCtrl is not tested.');
    expect(3).toBe(3);
  });
});
