angular.module('QuiverCMS', ['ngStorage'])

  // .config()
  // .run()
  .factory('moment', function ($window) {
    return $window.moment;
  })
  .factory('_', function ($window) {
    return $window._;
  })
  .service('ProductService', function () {
    return {
      setProduct: function (product) {
        return localStorage.setItem('quiver-cms-product-' + slug, product);
      },

      getProduct: function (slug) {
        var product = localStorage.getItem('quiver-cms-product-' + slug);
        return product ? JSON.parse(product) : undefined;
      }
    };
  })
  .controller('MasterCtrl', function ($scope, $timeout, $localStorage, ProductService, moment, _) {
    $scope.$storage = $localStorage;

    /*
     * Cart
    */
    var updateCart = function () {
      var cart = $scope.$storage.cart,
        now = moment().format(),
        item,
        i;

      if (!cart || !cart.items || !Array.isArray(cart.items)) {
        cart = {
          created: now,
          items: []
        };
      }

      cart.productCount = 0;
      cart.subTotal = 0;
      cart.tax = 0;
      cart.shipping = 0;
      cart.productCount = 0;
      cart.updated = now;

      i = cart.items.length;



      while (i--) {
        item = cart.items[i];

        if (!item) {
          cart.splice(i, 1);
        } else {
          cart.productCount += 1;
          cart.subTotal += item.price + (item.priceAdjustment || 0);
        }

      }

      cart.total = cart.subTotal + cart.tax + cart.shipping;

      $scope.$storage.cart = cart;

    };

    $scope.addToCart = function (slug) {
      var product = ProductService.getProduct(slug),
      cart = $scope.$storage.cart,
      i,
      exists = false;

      if (!cart || !cart.items || !Array.isArray(cart.items)) {
        cart = {
          items: []
        };
      }

      i = cart.items.length;

      while (i--) {
        if (cart.items[i].slug === slug) {
          exists = true;
        }
      }

      if (exists) {
        console.warn('product already in cart');
      } else {
        cart.items.push(product);
        $scope.$storage.cart = cart;
      }

      return updateCart();

    };

    $scope.removeFromCart = function (slug) {
      if (!$scope.$storage.cart || !$scope.$storage.cart.items || !$scope.$storage.cart.items.length) return;

      $scope.$storage.cart.items = _.filter($scope.$storage.cart.items, function (item) {
        return item.slug !== slug;
      });

      updateCart();
    };

    $scope.inCart = function (slug) {
      var items = $scope.$storage.cart && $scope.$storage.cart.items ? $scope.$storage.cart.items : [];

      return !!_.find(items, function (item) {
        return item.slug === slug;
      });

    };

  });
