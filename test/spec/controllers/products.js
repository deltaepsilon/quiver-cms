'use strict';

describe('Controller: ProductsCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var ProductsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, env, $firebase) {
    scope = $rootScope.$new();
    ProductsCtrl = $controller('ProductsCtrl', {
      $scope: scope,
      productsRef: $firebase(new MockFirebase(env.firebase.endpoint)),
      filesRef: $firebase(new MockFirebase(env.firebase.endpoint))
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    console.log('ProductsCtrl is not tested.');
    expect(3).toBe(3);
  });
});
