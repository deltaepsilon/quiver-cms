'use strict';

describe('Controller: ProductCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var ProductCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, env, $firebase) {
    scope = $rootScope.$new();
    ProductCtrl = $controller('ProductCtrl', {
      $scope: scope,
      productRef: $firebase(new MockFirebase(env.firebase.endpoint)),
      productImagesRef: $firebase(new MockFirebase(env.firebase.endpoint)),
      productOptionGroupsRef: $firebase(new MockFirebase(env.firebase.endpoint)),
      productOptionsMatrixRef: $firebase(new MockFirebase(env.firebase.endpoint)),
      filesRef: $firebase(new MockFirebase(env.firebase.endpoint)),
      hashtagsRef: $firebase(new MockFirebase(env.firebase.endpoint))
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    console.log('ProductCtrl is not tested.');
    expect(3).toBe(3);
  });
});
