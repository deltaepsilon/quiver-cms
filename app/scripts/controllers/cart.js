'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:CartCtrl
 * @description
 * # CartCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('CartCtrl', function($scope, $localStorage, $state, _, moment, products, countriesStatus, statesStatus, shipping, clientToken, CommerceService, NotificationService, braintree, ObjectService, Analytics, TrackingService, user, env, $location, $mdDialog, $timeout) {
        /*
         * Storage
         */
        $scope.$storage = $localStorage;

        if ($scope.$storage.cart && $scope.$storage.cart.paymentToken) {
            delete $scope.$storage.cart.paymentToken;
        }

        /*
         * Products
         */
        // Injecting loaded array

        /*
         * Navigation
         */
        $scope.goToCheckout = function() {
            $scope.checkingOut = true;
            $state.go('authenticated.master.nav.checkout');
            
            var cart = $scope.$storage.cart;
            TrackingService.track('InitiateCheckout', {
                value: cart.total,
                currency: 'USD',
                content_name: 'product',
                content_ids: _.pluck(cart.items, 'key'),
                num_items: cart.items.length,
                userEmail: user ? user.email : undefined,
                userId: user ? user.$id : undefined
            });
        };

        /*
         * Commerce
         */
        var countries = _.filter(CommerceService.getCountries(), function(country) {
                return countriesStatus[country['alpha-2']] ? countriesStatus[country['alpha-2']].enabled : false;
            }),
            states = _.filter(CommerceService.getStates(), function(state) {
                return statesStatus[state.abbreviation] ? statesStatus[state.abbreviation].enabled : false;
            }),
            cleanedCountryCodes = _.map(CommerceService.getCountryCodes(), function(code) {
                var dialCode = code.dial_code,
                    i = 6 - dialCode.length;

                while (i--) {
                    dialCode += " ";
                }
                return {
                    key: code.dial_code,
                    value: dialCode + " " + code.code
                };
            }),
            COUNTRY_CODE_REGEX = /(\s|\+)/g,
            countryCodes = _.sortBy(cleanedCountryCodes, function(code) {
                return parseInt(code.key.replace(COUNTRY_CODE_REGEX, ""));
            });

        $scope.countries = countries;
        $scope.states = states;

        /*
         * Cart
         */
        var updateCart = function() {
            var cart = $scope.$storage.cart,
                now = moment().format(),
                item,
                i,
                product;

            if (!cart || !cart.items || !Array.isArray(cart.items)) {
                cart = {
                    created: now,
                    items: []
                };
            }

            cart.productCount = 0;
            cart.subtotal = 0;
            cart.tax = 0;
            cart.shipping = 0;
            cart.discount = 0;
            cart.domesticShipping = 0;
            cart.internationalShipping = 0;
            cart.productCount = 0;
            cart.updated = now;
            cart.shipped = false;
            cart.taxable = false;
            cart.internationalAllowed = true;

            i = cart.items.length;

            while (i--) {
                item = cart.items[i];

                // Update cart item with latest product specs
                product = _.find(products, function(product) {
                    return product.slug === item.slug;
                });

                product = _.clone(product);

                if (item.optionsMatrixSelected) {
                    product.optionsMatrixSelected = product.optionsMatrix[item.optionsMatrixSelected.slug];
                    product.priceAdjusted = product.price + (product.optionsMatrixSelected.priceDifference || 0);
                    product.optionsMatrixSelected.inStock = typeof product.optionsMatrixSelected.inventory === 'number' ? product.optionsMatrixSelected.inventory > 0 : true;
                }

                product.quantity = item.quantity || 0;

                if (!product.quantity || product.quantity < 1) {
                    product.quantity = 1;
                }

                if (product.inventory || product.inventory === 0) {
                    product.maxQuantity = product.inventory;
                } else if (product.optionsMatrixSelected && (product.optionsMatrixSelected.inventory || product.optionsMatrixSelected.inventory === 0)) {
                    product.maxQuantity = product.optionsMatrixSelected.inventory;
                }

                if (product.maxQuantity) {
                    product.quantity = Math.min(product.quantity, product.maxQuantity);
                }

                if (product.shipped || (product.optionsMatrixSelected && product.optionsMatrixSelected.shipped)) {
                    product.shipped = true;
                    cart.shipped = true;

                    if (product.shipping) {
                        if (!product.shipping.internationalAllowed) {
                            cart.internationalAllowed = false;
                        }

                        cart.domesticShipping += (product.shipping.domesticBase || 0) + (product.shipping.domesticIncremental || 0) * product.quantity;
                        cart.internationalShipping += (product.shipping.internationalBase || 0) + (product.shipping.internationalIncremental || 0) * product.quantity;

                    }

                }

                if (product.taxable) {
                    cart.taxable = true;
                }

                if (!product) {
                    cart.items.splice(i, 1);
                } else {
                    cart.items.splice(i, 1, product); // Update item in place
                    cart.productCount += 1;
                    cart.subtotal += (product.priceAdjusted || product.price) * product.quantity;

                    if ($scope.$storage.address) {
                        if (product.taxable && $scope.$storage.address.tax) {
                            cart.tax += (product.priceAdjusted || product.price) * product.quantity * $scope.$storage.address.tax;
                        }

                    }

                }

            }

            if ($scope.$storage.address) {
                if ($scope.$storage.address.domestic) {
                    cart.shipping = cart.domesticShipping + ($scope.shipping.domesticBaseRate || 0);
                } else if ($scope.$storage.address.international) {
                    cart.shipping = cart.internationalShipping + ($scope.shipping.internationalBaseRate || 0);
                }
            }

            cart.subtotal = Math.round(cart.subtotal * 100) / 100;
            cart.taxPercentage = cart.tax / cart.subtotal; // Use cart.taxPercentage to re-apply taxes after calculating discounts.

            var finishIt = function() {
                cart.tax = cart.taxPercentage * Math.max(cart.subtotal - cart.discount, 0);
                cart.tax = Math.round(cart.tax * 100) / 100;
                cart.shipping = Math.round(cart.shipping * 100) / 100;

                if (!cart.shipped || (typeof $scope.shipping.minOrder === 'number' && cart.subtotal > $scope.shipping.minOrder) || cart.freeShipping) {
                    cart.shipping = 0;
                    cart.freeShipping = true;
                }

                cart.total = cart.subtotal + cart.tax + cart.shipping - cart.discount;
                if (isNaN(cart.total)) {
                    cart.total = 0
                }
                $scope.$storage.cart = cart;
            }

            if (cart.codes && cart.codes.length) {
                var applied = [];

                CommerceService.refreshCodes(cart.codes).then(function(res) {
                    var codes = _.sortBy(res.codes, function(code) {
                            return code.type === 'value' ? 0 : 1; // We want value codes to get evaluated before percentage codes
                        }),
                        now = moment().unix(),
                        valid = [];

                    _.each(codes, function(code) {
                        if (code.productSlug && !_.findWhere(cart.items, {
                                slug: code.productSlug
                            })) { // Screen off product-specific codes
                            return NotificationService.notify(code.code, 'Code is product-specific. Product not found in cart.');
                        }

                        if (~applied.indexOf(code.code)) {
                            return NotificationService.notify(code.code, 'Duplicate code must be ignored!');
                        }

                        if (code.useCount >= code.uses) {
                            return NotificationService.notify(code.code, 'Code has been used too many times!');
                        }

                        if (!code.active) {
                            return NotificationService.notify(code.code, 'Code inactive!');
                        }

                        if (code.minSubtotal && cart.subtotal < code.minSubtotal) {
                            return NotificationService.notify(code.code, 'Cart is below minimum subtotal. Code cannot be applied.');
                        }

                        if (moment(code.expiration).unix() < now) {
                            return NotificationService.notify(code.code, 'Code has expired.');
                        }

                        if (code.freeShipping) {
                            cart.freeShipping = true;
                        }

                        applied.push(code.code);
                        valid.push(code);

                        if (code.type === 'value') {
                            code.discount = code.value;
                        } else if (code.type === 'percentage') {
                            if (code.maxSubtotal) {
                                code.discount = Math.min(cart.subtotal, code.maxSubtotal) * code.percentage * .01;
                            } else {
                                code.discount = cart.subtotal * code.percentage * .01;
                            }

                        }
                        cart.discount += code.discount;

                    });

                    cart.codes = valid;

                    finishIt();

                });



            } else {
                if (cart.freeShipping) {
                    delete cart.freeShipping;
                };

                finishIt();
            }




        };

        $scope.updateCart = updateCart;

        /*
         * Address
         */
        var removeAddress = function() {
                $scope.$storage.address = false;
                $scope.$storage.cart.address = false;
            },
            updateAddress = function() {
                var address = $scope.$storage.address || {},
                    country = address.country ? countriesStatus[address.country] : null,
                    state = address.country === 'US' && address.state ? statesStatus[address.state] : null;

                if (country && country.enabled && address.country === 'US' && state) {
                    address.tax = (country.tax || 0) + (state.tax || 0);
                    address.domestic = country.domestic;
                    address.international = !country.domestic;

                } else if (country && country.enabled && address.country !== 'US') {
                    address.tax = (country.tax || 0);
                    address.domestic = country.domestic;
                    address.international = !country.domestic;

                } else {
                    address.tax = false;
                    address.domestic = false;
                    address.international = false;

                }

                $scope.$storage.address = address;
                updateCart();
            },
            validateAddress = function(address) {
                var address = address || {},
                    country = address.country ? _.findWhere(CommerceService.getCountries(), {
                        'alpha-2': address.country
                    }) : null,
                    state = address.country === 'US' ? _.findWhere(CommerceService.getStates(), {
                        'abbreviation': address.state
                    }) : null,
                    territory = address.territory,
                    formattedAddress = {
                        recipient: address.recipient,
                        email: address.email,
                        phone: (typeof address.countryCodeIndex !== 'undefined' ? countryCodes[address.countryCodeIndex].key : "") + " " + (address && address.phone ? address.phone.replace(/[^\d]/g, "") : ""),
                        sms: address.sms || false,
                        street1: address.street1 && address.street1.length ? address.street1 : null,
                        street2: address.street2 && address.street2.length ? address.street2 : null,
                        street3: address.street3 && address.street3.length ? address.street3 : null,
                        city: address.city,
                        territory: state ? state.abbreviation : address.territory,
                        territoryName: state ? state.name : address.territory,
                        country: country ? country['alpha-2'] : null,
                        countryName: country ? country.name : null,
                        postalCode: address.postalCode,
                        isUS: address.country === 'US',
                        instructions: address.instructions
                    },
                    errorMessages = {};

                if (!formattedAddress.recipient) {
                    errorMessages.recipient = 'Missing recipient name.';
                }

                if (!formattedAddress.street1) {
                    errorMessages.street = 'Missing street line 1.';
                }

                if (!formattedAddress.city) {
                    errorMessages.city = 'Missing city.';
                }

                if (!formattedAddress.email) {
                    errorMessages.email = 'Missing recipient email.';
                }

                if (!formattedAddress.phone) {
                    errorMessages.phone = 'Missing recipient phone.';
                }

                if (!formattedAddress.territory) {
                    if (address.country === 'US') {
                        errorMessages.territory = 'Missing state.';
                    } else {
                        errorMessages.territory = 'Missing territory.';
                    }

                }

                if (!formattedAddress.country) {
                    errorMessages.country = 'Missing country.';
                }

                if (!formattedAddress.postalCode) {
                    errorMessages.postalCode = 'Missing postal code.';
                }

                $scope.errorMessages = errorMessages;

                return !Object.keys(errorMessages).length ? formattedAddress : false;

            },
            editAddress = function() {
                if (!$scope.$storage.address) {
                    $scope.$storage.address = {
                        email: user.preferredEmail || user.email
                    };
                }

                if (!$scope.$storage.address.country) {
                    $scope.$storage.address.country = 'US';
                }

                if (!$scope.$storage.address.state && $scope.$storage.address.country === 'US') {
                    $scope.$storage.address.state = 'AL';
                }

                if (!$scope.$storage.address.countryCode) {
                    $scope.$storage.address.countryCodeIndex = 1;
                }


                $scope.validateAddress($scope.$storage.address);
                $scope.editingAddress = true;

            },
            saveAddress = function(address, cancel) {
                var address = $scope.validateAddress(address);

                if (address) {
                    $scope.$storage.cart.address = address;
                }

                $scope.editingAddress = false;

                if ($scope.errorMessages && Object.keys($scope.errorMessages).length) {
                    _.each($scope.errorMessages, function(error, type) {
                        NotificationService.error('Address Verification Failed', error);
                    });
                } else {
                    cancel();
                }

            };

        $scope.removeAddress = removeAddress;
        $scope.updateAddress = updateAddress;
        $scope.validateAddress = validateAddress;
        $scope.editAddress = editAddress;
        $scope.saveAddress = saveAddress;

        // if (!$scope.$storage.cart || !$scope.$storage.cart.address || !$scope.validateAddress($scope.$storage.cart.address)) {
        //     $scope.editingAddress = true;
        // } else {
        //     $scope.editingAddress = false;
        // }

        // $scope.editAddress();

        $scope.addressDialog = function(e) {
            $mdDialog.show({
                controller: function($scope, $mdDialog) {
                    $scope.$storage = $localStorage;

                    $scope.countryCodes = countryCodes;
                    $scope.countries = countries;
                    $scope.states = states;
                    $scope.removeAddress = removeAddress;
                    $scope.updateAddress = updateAddress;
                    $scope.validateAddress = validateAddress;
                    $scope.editAddress = editAddress;
                    $scope.saveAddress = saveAddress;

                    $scope.cancel = $mdDialog.cancel;
                },
                templateUrl: "views/address-dialog.html",
                targetEvent: e
            });
        };

        /*
         * Payment Dialog
         */
        $scope.paymentDialog = function(e) {
            $mdDialog.show({
                controller: function($scope, $mdDialog) {
                    $scope.clientToken = clientToken;
                    $scope.cancel = $mdDialog.cancel;
                    $scope.onSave = function() {
                        var unwatch = user.$watch(function() {
                            selectFirstPaymentToken();
                            unwatch();
                        });
                        $mdDialog.cancel();
                    };
                },
                templateUrl: "views/payment-method-dialog.html",
                targetEvent: e
            });
        };

        /*
         * Analytics
         */
        var trackCheckout = function() {
            if ($scope.$storage.cart) {
                CommerceService.addProducts($scope.$storage.cart);

                if ($state.current.name === 'master.nav.cart') {
                    Analytics.trackCheckout(1);
                    TrackingService.track('ViewContent', {content_name: 'cart1'});
                } else if ($state.current.name === 'authenticated.master.nav.checkout') {
                    Analytics.trackCheckout(2);
                    TrackingService.track('ViewContent', {content_name: 'cart2'});
                }

            }

        };

        /*
         * Shipping
         */
        shipping.$loaded().then(function(shipping) {
            $scope.shipping = shipping;
            $scope.updateAddress();
            trackCheckout();
        });

        /*
         * Cart Actions
         */
        $scope.removeFromCart = function(product) {
            var items = $scope.$storage.cart.items,
                i = items.length;

            while (i--) {
                if (_.isEqual(product, items[i])) {
                    $scope.$storage.cart.items.splice(i, 1);
                }
            }

            updateCart();
        };

        $scope.addCode = function(code) {
            CommerceService.getCode(code).then(function(codeObject) {
                if (!$scope.$storage.cart.codes) {
                    $scope.$storage.cart.codes = [];
                }

                if (_.findWhere($scope.$storage.codes, {
                        code: codeObject.code
                    })) {
                    NotificationService.notify(codeObject.code, 'Code already present in cart.');
                } else {
                    $scope.$storage.cart.codes.push(ObjectService.cleanRestangular(codeObject));
                    $scope.addingCode = false;
                    delete $scope.discountCode;
                    updateCart();
                }

            }, function(err) {
                NotificationService.error(code, err && err.data && err.status !== 502 ? err.data : 'Code not found.');
            });
        };

        $scope.removeCode = function(code) {
            var cart = $scope.$storage.cart,
                codes = cart.codes || [],
                i = codes.length;

            while (i--) {
                if (codes[i].code === code) {
                    codes.splice(i, 1);
                };
            }
            $scope.$storage.cart = cart;
            updateCart();

        };

        $scope.emptyCart = function() {
            delete $scope.$storage.cart;
        };

        /*
         * Checkout
         */
        $scope.removePaymentMethod = function(token) {
            if (token === $scope.$storage.cart.paymentToken) {
                $scope.$storage.cart.paymentToken = false;
            }

            CommerceService.removePaymentMethod(token).then(function(response) {
                if (response.error) {
                    NotificationService.error('Card Error', response.error);
                } else {
                    NotificationService.success('Card Removed');
                }
            }, function(err) {
                NotificationService.error('Card Error', err);
            });
        };

        var selectFirstPaymentToken = function() {
            if (user && user.private && $scope.$storage.cart) {
                if (user.private.customer.creditCards && user.private.customer.creditCards.length) {
                    $scope.$storage.cart.paymentToken = user.private.customer.creditCards[0].token;
                } else if (user.private.customer.paypalAccounts && user.private.customer.paypalAccounts.length) {
                    $scope.$storage.cart.paymentToken = user.private.customer.paypalAccounts[0].token;
                } else if (user.private.customer.coinbaseAccounts && user.private.customer.coinbaseAccounts.length) {
                    $scope.$storage.cart.paymentToken = user.private.customer.coinbaseAccounts[0].token;
                }
            }
        };
        $scope.selectFirstPaymentToken = selectFirstPaymentToken;
        selectFirstPaymentToken();

        $scope.checkout = function(cart) {
            $scope.checkingOut = true;

            CommerceService.addProducts(cart);
            Analytics.trackCheckout(3);
            TrackingService.track('ViewContent', {content_name: 'cart3'});

            if ($scope.$storage.referral) {
                cart.referral = $scope.$storage.referral;
                cart.referer = cart.referral.referral || 'unknown';
                delete $scope.$storage.referral;
            }

            CommerceService.checkout(cart).then(function(transaction) {
                var transactionId = transaction.keys.log,
                    affiliation = env.root,
                    revenue = transaction.total,
                    tax = transaction.tax,
                    shipping = transaction.shipping,
                    coupon = transaction.codes ? _.pluck(transaction.codes, 'code').join('|') : undefined,
                    list = transaction.list,
                    step = transaction.step,
                    option = transaction.paymentToken;

                CommerceService.addProducts(transaction);
                CommerceService.addCodes(transaction);
                Analytics.trackTransaction(transactionId, affiliation, revenue, tax, shipping, coupon, list, step, option);
                TrackingService.track('Purchase', {
                    value: transaction.total,
                    currency: 'USD',
                    content_type: 'product',
                    content_ids: _.pluck(transaction.items, 'slug'),
                    order_id: transactionId,
                    num_items: transaction.items.length,
                    userEmail: transaction.userEmail
                });

                NotificationService.success('Checkout Successful');

                $timeout(function() {
                    $state.go('authenticated.master.nav.transaction', {
                        userId: transaction.userId,
                        key: transaction.keys.user
                    });
                });
            }, function(err) {
                NotificationService.error('Checkout Error', err.statusText);
                $state.go('authenticated.master.nav.dashboard');
            }).finally(function(transaction) {
                $scope.emptyCart();
                delete $scope.checkingOut;
            });
        };

        /*
         * Parameters
         * Pattern: https://quiver.is/app/cart?product=my-product-slug&option=my-product-option-slug&code=MYDISCOUNTCODE&referral=http:%2F%2Fmy-referral-string.com&creative=my-ad-name&position=my-ad-position
         */
        var inCart = function(product) {
                var items = $scope.$storage.cart && $scope.$storage.cart.items ? $scope.$storage.cart.items : [],
                    testEquality = function(a, b) {
                        var whitelist = ['slug', 'optionsMatrixSelected', 'price', 'discount'];
                        return _.isEqual(_.pick(a, whitelist), _.pick(b, whitelist));
                    };;

                return !!_.find(items, function(item) {
                    return testEquality(item, product);
                });

            },
            evaluateParameters = function(search) {
                if (search.product) {
                    var product = _.findWhere(products, {
                        slug: search.product
                    });

                    if (product.optionsMatrix) {
                        if (search.option) {
                            product.optionsMatrixSelected = product.optionsMatrix[search.option];
                        }

                        if (!product.optionsMatrixSelected) { // Default to the first option
                            product.optionsMatrixSelected = product.optionsMatrix[Object.keys(product.optionsMatrix)[0]];
                        }

                    }

                    if (!$scope.$storage.cart || !$scope.$storage.cart.items) {
                        $scope.$storage.cart = {
                            items: []
                        }
                    }

                    if (!inCart(product)) {
                        $scope.$storage.cart.items.push(product);
                    }

                }

                if (search.code) {
                    $scope.addCode(search.code);
                }

                if (search.referral) {
                    $scope.$storage.referral = search;
                    Analytics.addPromo('referral', search.referral, search.creative, search.position);
                    Analytics.pageView();
                    TrackingService.trackCustom('referral', search);
                }
            };
        evaluateParameters($location.search());

    });