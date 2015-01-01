'use strict';

describe('Controller: BulkUploadCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var BulkUploadCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    BulkUploadCtrl = $controller('BulkUploadCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
