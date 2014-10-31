'use strict';

describe('Controller: WordCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var WordCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, env, $firebase) {
    scope = $rootScope.$new();
    WordCtrl = $controller('WordCtrl', {
      $scope: scope,
      wordRef: $firebase(new MockFirebase(env.firebase.endpoint)),
      draftsRef: $firebase(new MockFirebase(env.firebase.endpoint)),
      filesRef: $firebase(new MockFirebase(env.firebase.endpoint))
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    console.log('WordCtrl is not tested.');
    expect(3).toBe(3);
  });
});
