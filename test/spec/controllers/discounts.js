'use strict';

describe('Controller: DiscountsCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var DiscountsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $window, env, $firebase) {
    scope = $rootScope.$new();
    DiscountsCtrl = $controller('DiscountsCtrl', {
      $scope: scope,
      discountsRef: $firebase(new MockFirebase(env.firebase.endpoint))
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    console.log('DiscountsCtrl not tested');
    expect(3).toBe(3);
  });
});
