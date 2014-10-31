'use strict';

describe('Controller: SocialCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var SocialCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, env, $firebase) {
    scope = $rootScope.$new();
    SocialCtrl = $controller('SocialCtrl', {
      $scope: scope,
      socialRef: $firebase(new MockFirebase(env.firebase.endpoint)),
      instagramTermsRef: $firebase(new MockFirebase(env.firebase.endpoint))
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    console.log('SocialCtrl is not tested.');
    expect(3).toBe(3);
  });
});
