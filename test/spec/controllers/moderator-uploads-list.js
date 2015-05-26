'use strict';

describe('Controller: ModeratorUploadsListCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var ModeratorUploadsListCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ModeratorUploadsListCtrl = $controller('ModeratorUploadsListCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
