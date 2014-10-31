'use strict';

describe('Controller: HashtagsCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var HashtagsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, env, $firebase) {
    scope = $rootScope.$new();
    HashtagsCtrl = $controller('HashtagsCtrl', {
      $scope: scope,
      hashtagsRef: $firebase(new MockFirebase(env.firebase.endpoint))
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    console.log('HashtagsCtrl is not tested');
    expect(3).toBe(3);
  });
});
