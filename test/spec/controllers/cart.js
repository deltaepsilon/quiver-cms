'use strict';

describe('Controller: CartCtrl', function () {

  // load the controller's module
  beforeEach(module('quiverCmsApp'));

  var CartCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $window, $firebase, env, CommerceService, $q) {
    scope = $rootScope.$new();

    scope.shipping = $window.quiverMocks.shipping;

    CommerceService.refreshCodes = function (codes) {
      var codes = _.pluck(codes, 'code'),
        trustedCodes = _.toArray($window.quiverMocks.discounts),
        unique = _.filter(trustedCodes, function(trustedCode) {
          if (!~codes.indexOf(trustedCode.code)) {
            return false;
          } 
          return true;
        }),
        sorted = _.sortBy(unique, function (code) {
          return code.type === 'value' ? 0 : 1;
        });

      return {
        then: function (incomingFunction) {
          incomingFunction({codes: sorted});
        }
      };
    };


    CartCtrl = $controller('CartCtrl', {
      $scope: scope,
      products: $window.quiverMocks.products,
      countriesStatus: $window.quiverMocks.countriesStatus,
      statesStatus: $window.quiverMocks.statesStatus,
      shippingRef: $firebase(new MockFirebase(env.firebase.endpoint, $window.quiverMocks.shipping)),
      clientToken: 5,
      CommerceService: CommerceService
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
    scope.$storage.cart.items = [];
    scope.$storage.cart.items.push({slug: 'calligraphy-class', optionsMatrixSelected: {slug: 'green|small|street|narrow'}});
    scope.updateCart();

    expect(scope.$storage.cart.taxable).toBe(true);
  }));

  it('should not mark the cart as taxable if there are no taxable items.', inject(function ($window) {
    scope.$storage.cart.items = [];
    scope.$storage.cart.items.push({slug: 'brush-lettering-class'});
    scope.updateCart();

    expect(scope.$storage.cart.taxable).toBe(false);
  }));

  it('should mark the cart as shipped if there at least is one shipped item.', inject(function ($window) {
    scope.$storage.cart.items = [];
    scope.$storage.cart.items.push({slug: 'calligraphy-class', optionsMatrixSelected: {slug: 'green|small|street|narrow'}});
    scope.updateCart();

    expect(scope.$storage.cart.shipped).toBe(true);
  }));

  it('should not mark the cart as shipped if there are no shipped items.', inject(function ($window) {
    scope.$storage.cart.items = [];
    scope.$storage.cart.items.push({slug: 'brush-lettering-class'});
    scope.updateCart();

    expect(scope.$storage.cart.shipped).toBe(false);
  }));

  it('should respect code.maxSubtotal', inject(function ($window) {
    var code = _.findWhere($window.quiverMocks.discounts, {code: 'ONEHUNDREDMAX1000'});
    scope.$storage.cart.codes = [code];

    scope.$storage.address = {
      country: 'US',
      state: 'UT'
    };
    
    scope.updateAddress();

    expect(scope.$storage.cart.discount).toBe(1000);
    expect(scope.$storage.cart.subtotal).toBe(1735);
    expect(Math.round(scope.$storage.cart.total * 100)/100).toBe(1212.95); // 735 + 477.95 in tax

    scope.$storage.cart.items = [];
    scope.$storage.cart.items.push({slug: 'sign-painting-workshop'});
    scope.updateCart();

    

    expect(scope.$storage.cart.discount).toBe(150);
    expect(scope.$storage.cart.subtotal).toBe(150);
    expect(scope.$storage.cart.total).toBe(0);

  }));  
  
  it('should respect code.minSubtotal', inject(function ($window) {
    var code = _.findWhere($window.quiverMocks.discounts, {code: '100MIN1000'});
    scope.$storage.cart.codes = [code];

    scope.updateCart();

    expect(scope.$storage.cart.discount).toBe(100);
    expect(scope.$storage.cart.total).toBe(1635);

    scope.$storage.cart.items = [];
    scope.$storage.cart.items.push({slug: 'sign-painting-workshop'});
    scope.updateCart();

    expect(scope.$storage.cart.discount).toBe(0);
    expect(scope.$storage.cart.subtotal).toBe(150);  

  }));

  it('should respect code.productSlug', inject(function ($window) {
    var code = _.findWhere($window.quiverMocks.discounts, {code: 'CALLIGRAPHYONLY'});
    scope.$storage.cart.codes = [code];

    scope.updateCart();

    expect(scope.$storage.cart.discount).toBe(95);
    expect(scope.$storage.cart.total).toBe(1640);

    scope.$storage.cart.items = [];
    scope.$storage.cart.items.push({slug: 'sign-painting-workshop'});
    scope.updateCart();

    expect(scope.$storage.cart.discount).toBe(0);
    expect(scope.$storage.cart.subtotal).toBe(150);

  }));

  it('should respect code.uses', inject(function ($window) {
    var code = _.findWhere($window.quiverMocks.discounts, {code: '10ONEUSE'});
    scope.$storage.cart.codes = [code];

    scope.updateCart();

    expect(scope.$storage.cart.discount).toBe(10);
    expect(scope.$storage.cart.total).toBe(1725);

    scope.$storage.cart.codes[0].useCount = 1;
    scope.updateCart();

    expect(scope.$storage.cart.discount).toBe(0);
    expect(scope.$storage.cart.subtotal).toBe(1735);

  }));

  it('should respect code.freeShipping', inject(function ($window) {
    var code = _.findWhere($window.quiverMocks.discounts, {code: 'ONLYFREESHIPPING'});
    scope.$storage.cart.codes = [code];

    scope.$storage.address = {
      country: 'US',
      state: 'UT'
    };

    scope.updateAddress();

    expect(scope.$storage.cart.discount).toBe(0);
    expect(scope.$storage.cart.shipping).toBe(0);
    expect(scope.$storage.cart.total).toBe(2863.23);

  }));

  it('should respect code.expiration', inject(function ($window) {
    var code = _.findWhere($window.quiverMocks.discounts, {code: '10EXPIRED'});
    scope.$storage.cart.codes = [code];

    scope.updateCart();

    expect(scope.$storage.cart.discount).toBe(0);
    expect(scope.$storage.cart.total).toBe(1735);

  }));

  it('should respect code.minSubtotal and code.maxSubtotal when used together', inject(function ($window) {
    var code = _.findWhere($window.quiverMocks.discounts, {code: '5PERCENTMINANDMAX'});
    scope.$storage.cart.codes = [code];

    scope.updateCart();

    expect(scope.$storage.cart.discount).toBe(200 * .05);
    expect(scope.$storage.cart.total).toBe(1735 - 200 * .05);

    scope.$storage.cart.items = [];
    scope.$storage.cart.items.push({slug: 'calligraphy-class'});
    scope.updateCart();

    expect(scope.$storage.cart.discount).toBe(0);
    expect(scope.$storage.cart.subtotal).toBe(12);

  }));

  it('should respect a 100% off subtotal with free shipping', inject(function ($window) {
    var code = _.findWhere($window.quiverMocks.discounts, {code: 'NEVERPAY'});
    scope.$storage.cart.codes = [code];

    scope.$storage.address = {
      country: 'US',
      state: 'UT'
    };

    scope.updateAddress();

    expect(scope.$storage.cart.discount).toBe(1735);
    expect(scope.$storage.cart.total).toBe(0);

  }));

  it('should respect a code with productSlug, freeShipping, a uses limit and min- and max-subtotals of equal value.', inject(function ($window) {
    var code = _.findWhere($window.quiverMocks.discounts, {code: 'FREECALLIGRAPHY'});
    scope.$storage.cart.codes = [code];

    scope.$storage.address = {
      country: 'US',
      state: 'UT'
    };

    scope.updateAddress();

    expect(scope.$storage.cart.discount).toBe(95);
    expect(scope.$storage.cart.total).toBe(2706.45);

    scope.$storage.cart.items = [];
    scope.$storage.cart.items.push({slug: 'calligraphy-class'});
    scope.updateCart();

    expect(scope.$storage.cart.discount).toBe(0);
    expect(scope.$storage.cart.subtotal).toBe(12);

  }));

});
