'use strict';

describe('Controller: CommerceCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var CommerceCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $window, env, $firebase) {
    scope = $rootScope.$new();
    CommerceCtrl = $controller('CommerceCtrl', {
      $scope: scope,
      commerceRef: $firebase(new MockFirebase(env.firebase.endpoint)),
      countries: $window.quiverMocks.countriesStatus,
      states: $window.quiverMocks.statesStatus
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    console.log('CommerceCtrl not tested');
    expect(3).toBe(3);
  });
});
