'use strict';

describe('Controller: FeedbackCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var FeedbackCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    FeedbackCtrl = $controller('FeedbackCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
