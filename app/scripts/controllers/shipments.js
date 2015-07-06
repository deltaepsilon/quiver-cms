'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:ShipmentsCtrl
 * @description
 * # ShipmentsCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
    .controller('ShipmentsCtrl', function($scope, $q, $timeout, env, items, AdminService, UserService, CommerceService, NotificationService, ShipmentService, _, $mdDialog, $localStorage) {

        /*
         * Items
         */
        $scope.items = items;

        $scope.orderBy = "-$id";

        /*
         * Shipments
         */

        var save = function(shipment) {
            UserService.getShipment(shipment.transaction.user.public.id, shipment.keys.user).$loaded()
                .then(function(userShipment) {
                    _.each(shipment, function(value, key) {
                        if (key.substr(0, 1) !== "$") {
                            userShipment[key] = value;
                        }
                    });

                    if (!shipment.shipped) {
                        delete userShipment.shipped;
                    }
                    if (!shipment.comments) {
                        delete userShipment.comments;
                    }
                    if (!shipment.tracking) {
                        delete userShipment.tracking;
                    }

                    return userShipment.$save();
                })
                .then(function() {
                    return $scope.items.$save(shipment);
                })
                .then(function() {
                    NotificationService.success('Saved');
                }, function(err) {
                    NotificationService.error('Save Failed', err);
                });
        };
        $scope.save = save;

        /*
         * Shipping
         */
        $scope.shipping = env.shipping;

        var getAddress = CommerceService.getAddress;
        $scope.getAddress = getAddress;

        var TRACKING_REGEX = /\$NUMBER/;
        var getTracking = function(tracking) {
            var carrier = tracking.carrier,
                number = tracking.number,
                link = $scope.shipping[carrier].link;

            return link.replace(TRACKING_REGEX, number);
        };
        $scope.getTracking = getTracking;

        var forcePrecision = function(value, multiplier) {
            value = Math.round(value * multiplier) / multiplier;
            return value;
        };
        $scope.forcePrecision = forcePrecision;

        /*
         * Manage shipment
         */
        var verifyDataStructure = function() {
            if (!$scope.$storage.shipment) {
                $scope.$storage.shipment = {};
            }

            if (!$scope.$storage.shipment.customs) {
                $scope.$storage.shipment.customs = {};
            }

            if (!$scope.$storage.shipment.customs.customs_items) {
                $scope.$storage.shipment.customs.customs_items = [];
            }
        };

        var getUnverifiedAddress = function(shipment) {
            var address = shipment.transaction.address;

            return {
                name: address.recipient,
                street1: address.street1,
                street2: address.street2,
                street3: address.street3,
                city: address.city,
                state: address.territory,
                zip: address.postalCode,
                country: address.country,
                email: address.email || shipment.transaction.user.email,
                phone: address.phone

            };
        };
        $scope.getUnverifiedAddress = getUnverifiedAddress;

        var createAddress = function(address) {
            var promise = ShipmentService.createAddress(address);

            promise.then(function(response) {
                if (response.message) {
                    NotificationService.notify(response.message);
                }

                if (response.address) {
                    verifyDataStructure();
                    $scope.$storage.shipment.toAddress = response.address;
                }
            }, function (error) {
                NotificationService.error(error.data.message.message);
            });

            return promise;
        };

        $scope.createAddress = createAddress;

        var forceAddress = function(address) {
            verifyDataStructure();
            $scope.$storage.shipment.toAddress = _.clone(address);
        };

        $scope.forceAddress = forceAddress;


        var selectShipment = function(e, shipment) {
            verifyDataStructure();

            if ($scope.$storage.shipment.toAddress) {
                delete $scope.$storage.shipment.toAddress;
            }

            $scope.selectedShipment = shipment;
            $scope.unverifiedAddress = $scope.getUnverifiedAddress(shipment);
            $scope.createAddress($scope.unverifiedAddress);

            $scope.showShipmentDialog(e, shipment);

        };
        $scope.selectShipment = selectShipment;

        var toggleShipped = function(shipment) {
            if (typeof shipment !== 'object') {
                return console.log('shipment not valid', shipment);
            } else if (!shipment.shipped) {
                shipment.shipped = true;
            } else {
                delete shipment.shipped;
            }

            $scope.save(shipment);

        };
        $scope.toggleShipped = toggleShipped;

        var validateShipment = function(shipment) {
            var parcel = shipment.parcel;

            if (!parcel) {
                return false;
            } else if (!parcel.weight || (!parcel.predefined_package && (!parcel.length || !parcel.width || !parcel.height || !parcel.weight || !parcel.weight))) {
                return false;
            } else if (!shipment.fromAddress) {
                return false;
            } else if (!shipment.toAddress) {
                return false;
            } else if (!shipment.customs) {
                return false;
            }

            return true;
        };
        $scope.validateShipment = validateShipment;

        var addCustomsItem = function(shipment) {
            verifyDataStructure();

            var item = shipment && shipment.item ? shipment.item : {};
            $scope.$storage.shipment.customs.customs_items.push({
                description: item.title || "",
                quantity: item.quantity || 0,
                weight: item.weight || 0,
                value: item.priceAdjusted || item.price || 0,
                hs_tariff_number: item.hsTariffNumber || "",
                origin_country: item.originCountry || 'US'
            });

            NotificationService.success('Customs', item.title + " added to customs form");
        };
        $scope.addCustomsItem = addCustomsItem;

        var removeCustomsItem = function(customsItems, index) {
            $timeout(function() { // Need to delay to avoid closing modal
                if (customsItems) {
                    customsItems.splice(index, 1);
                }
            });

        };
        $scope.removeCustomsItem = removeCustomsItem;

        var confirmBuyShipment = function(e, shipment, rate) {
            var confirm = $mdDialog.confirm()
                .title('Shipment')
                .content('Purchase shipment?')
                .ariaLabel('Purchase shipment?')
                .ok('Purchase!')
                .cancel("Hmm... not sure yet.")
                .targetEvent(e);

            $scope.buyingShipment = true;

            $mdDialog.show(confirm).then(function() {
                return ShipmentService.buyShipment(shipment.$id, shipment.quote.id, rate.id);
            }).then(function(response) {
                NotificationService.success('Purchase successful');
                ShipmentService.removeQuote($scope.selectedShipment.$id);
                delete $scope.buyingShipment;
                $scope.showShipmentDialog(e, shipment);
            }, function(error) {
                console.warn(error.data.message);
                NotificationService.error('Purchase failed', error.data.message.message);
                delete $scope.buyingShipment;
                $scope.showShipmentDialog(e, shipment);
            });

        };
        $scope.confirmBuyShipment = confirmBuyShipment;

        var confirmUpdateTracking = function(e, shipment, labelKey, tracking, email, smsEnabled) {
            var confirm = $mdDialog.confirm()
                .title('Update tracking')
                .content('Update tracking?')
                .ariaLabel('Update tracking')
                .ok('Update!')
                .cancel("Hmm... not sure yet.")
                .targetEvent(e);

            $scope.updatingTracking = true;
            $mdDialog.show(confirm).then(function() {
                return ShipmentService.updateTracking(shipment.$id, labelKey, tracking, email, smsEnabled);
            }).then(function() {
                NotificationService.success('Aftership updated');
                delete $scope.updatingTracking;
                $scope.showShipmentDialog(e, shipment);
            }, function(err) {
                NotificationService.error('Aftership failed', err);
                delete $scope.updatingTracking;
                $scope.showShipmentDialog(e, shipment);
            });

        };
        $scope.confirmUpdateTracking = confirmUpdateTracking;

        var confirmRefundShipment = function(e, shipment, labelId) {
            var confirm = $mdDialog.confirm()
                .title('Refund shipment')
                .content('Refund shipment?')
                .ariaLabel('Refund shipment?')
                .ok('Refund!')
                .cancel("Hmm... not sure yet.")
                .targetEvent(e);

            $mdDialog.show(confirm).then(function() {
                return ShipmentService.refundShipment(shipment.$id, labelId);
            }).then(function() {
                NotificationService.success('Refund processing');
                $scope.showShipmentDialog(e, shipment);
            }, function(err) {
                NotificationService.error('Refund failed', err);
                $scope.showShipmentDialog(e, shipment);
            });
        };
        $scope.confirmRefundShipment = confirmRefundShipment;

        /*
         * Shipment dialog
         */
        $scope.showShipmentDialog = function(e, shipment) {
            $mdDialog.show({
                controller: function($scope, $mdDialog) {
                    $scope.selectedShipment = shipment;
                    $scope.cancel = $mdDialog.cancel;
                    $scope.env = env;
                    $scope.save = save;
                    $scope.shipping = env.shipping;
                    $scope.unverifiedAddress = getUnverifiedAddress(shipment);
                    $scope.$storage = $localStorage;
                    $scope.getAddress = getAddress;
                    $scope.forcePrecision = forcePrecision;
                    $scope.toggleShipped = toggleShipped;
                    $scope.validateShipment = validateShipment;
                    $scope.addCustomsItem = addCustomsItem;
                    $scope.removeCustomsItem = removeCustomsItem;
                    $scope.confirmBuyShipment = confirmBuyShipment;
                    $scope.confirmUpdateTracking = confirmUpdateTracking;
                    $scope.confirmRefundShipment = confirmRefundShipment;

                    $scope.createShipment = function(newShipment) {
                        $scope.creatingShipment = true;
                        ShipmentService.createShipment({
                            to_address: newShipment.toAddress,
                            from_address: newShipment.fromAddress,
                            parcel: newShipment.parcel,
                            customs_info: newShipment.customs
                        }).then(function(response) {
                            ShipmentService.saveQuote($scope.selectedShipment.$id, response.shipment);
                            NotificationService.success('Shipment created');
                            if (response.shipment.messages && response.shipment.messages.length) {
                                _.each(response.shipment.messages, function (message) {
                                    console.warn(message.message);
                                    NotificationService.notify('Shipment issue', message.message); 
                                });
                            }
                            delete $scope.creatingShipment;

                        }, function(error) {
                            NotificationService.error('Shipment failed', error.data.message.message);
                            delete $scope.creatingShipment;
                        });
                    };

                    $scope.createAddress = function(address) {
                        $scope.verifying = true;
                        createAddress(address).then(function() {
                            delete $scope.verifying;
                        }, function () {
                            delete $scope.verifying;
                        });
                    };

                    $scope.forceAddress = function(address) {
                        forceAddress(address);
                    };

                },
                templateUrl: "views/shipment-dialog.html",
                targetEvent: e
            });
        };

    });