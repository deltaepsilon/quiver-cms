'use strict';

describe('Controller: HashtagsCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var HashtagsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    HashtagsCtrl = $controller('HashtagsCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
