'use strict';

describe('Controller: CartCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var CartCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $window, $firebase, env) {
    scope = $rootScope.$new();

    scope.shipping = $window.quiverMocks.shipping;


    CartCtrl = $controller('CartCtrl', {
      $scope: scope,
      products: $window.quiverMocks.products,
      countriesStatus: $window.quiverMocks.countriesStatus,
      statesStatus: $window.quiverMocks.statesStatus,
      shippingRef: $firebase(new MockFirebase(env.firebase.endpoint, $window.quiverMocks.shipping))
    });

    scope.$storage = {
      cart: $window.quiverMocks.cart,
      address: $window.quiverMocks.address
    };


    scope.$storage.cart.items = [];
    scope.$storage.cart.items.push({slug: 'calligraphy-class', optionsMatrixSelected: {slug: 'green|small|street|narrow'}});
    scope.$storage.cart.items.push({slug: 'brush-lettering-class'});
    scope.$storage.cart.items.push({slug: 'sign-painting-workshop', optionsMatrixSelected: {slug: 'large|gold'}});

    scope.$storage.cart.items[1].quantity = 2;
    scope.$storage.cart.items[2].quantity = 10;

  }));

  it('should calculate cart subtotal', function () {
    scope.updateAddress();
    expect(scope.$storage.cart.subtotal).toBe(1 * (12 + 3) + 2 * 100 + 10 * (150 + 2));
  });

  it('should calculate cart taxes with only base country rate, respecting taxable attribute', function () {
    scope.$storage.address = {
      country: 'AF',
      state: 'UT'
    };
    scope.updateAddress();

    expect(scope.$storage.cart.tax).toBe(153.50);
  });

  it('should calculate cart taxes with base country and state rates', function () {
    scope.$storage.address = {
      country: 'US',
      state: 'UT'
    };
    scope.updateAddress();

    expect(scope.$storage.cart.tax).toBe(1128.23);
  });

  it('should calculate cart domestic shipping with global base rate, product base rates and product incremental rates.', function () {

    scope.$storage.cart.items[2].quantity = 2;
    scope.$storage.address = {
      country: 'US',
      state: 'UT'
    };
    scope.updateAddress();

    expect(scope.$storage.cart.shipping).toBe(65);
  });

  it('should calculate cart international shipping with global base rate, product base rates and product incremental rates.', function () {

    scope.$storage.cart.items[2].quantity = 2;
    scope.$storage.address = {
      country: 'AF',
      state: 'UT'
    };
    scope.updateAddress();

    expect(scope.$storage.cart.shipping).toBe(40);
  });

  it('should provide free shipping over the shipping.minOrder value', inject(function ($window) {
    scope.$storage.cart.items[2].quantity = 20;
    scope.$storage.address = {
      country: 'US',
      state: 'UT'
    };
    scope.updateAddress();

    expect(scope.$storage.cart.subtotal > $window.quiverMocks.shipping.minOrder).toBe(true);
    expect(scope.$storage.cart.shipping).toBe(0);
  }));

  it('should mark the cart as taxable if there at least is one taxable item.', inject(function ($window) {
    
  }));

  it('should not mark the cart as taxable if there are no taxable items.', inject(function ($window) {
    
  }));

  it('should mark the cart as shipped if there at least is one shipped item.', inject(function ($window) {
    
  }));

  it('should not mark the cart as shipped if there are no shipped items.', inject(function ($window) {
    
  }));

});
