'use strict';

describe('Controller: ArchivedGalleryCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var ArchivedGalleryCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ArchivedGalleryCtrl = $controller('ArchivedGalleryCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
