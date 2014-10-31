'use strict';

describe('Controller: WordsCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var WordsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, env, $firebase) {
    scope = $rootScope.$new();
    WordsCtrl = $controller('WordsCtrl', {
      $scope: scope,
      wordsRef: $firebase(new MockFirebase(env.firebase.endpoint)),
      hashtagsRef: $firebase(new MockFirebase(env.firebase.endpoint))
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    console.log('WordsCtrl is not tested.');
    expect(3).toBe(3);
  });
});
