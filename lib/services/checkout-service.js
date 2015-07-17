var ConfigService = require('../services/config-service'),
    Q = require('q'),
    _ = require('underscore'),
    moment = require('moment'),
    request = require('superagent'),
    ObjectService = require('../services/object-service'),
    FirebaseService = require('../services/firebase-service'),
    EmailService = require('../services/email-service'),
    LogService = require('../services/log-service'),
    Utility = require('../extensions/utility');


module.exports = {
    createTransaction: function(user, cart) {
        return ObjectService.getUserTransactions(user.public.id).then(function(transactions) {
            var transaction = {
                user: _.omit(user, ['private']),
                userId: user.public.id,
                userEmail: user.preferredEmail || user.email,
                userName: user.name || user.preferredEmail || user.email,
                transactionCount: transactions && transactions.length ? transactions.length + 1 : 1,
                items: [],
                date: moment().format()
            };

            transaction = _.extend(transaction, _.omit(cart, ['items', 'nonce']));

            transaction.total = Math.round(transaction.total * 100) / 100;

            _.each(cart.items, function(item) {
                item.key = item.$id;
                transaction.items.push(_.omit(item, ['active', 'isValid', 'description', 'featuredImage', 'images', 'optionGroups', 'optionsMatrix', '$id', '$priority']));
            });

            return Utility.async(transaction).fulfilled;

        });

    },

    createSubscriptions: function(transaction) {
        var subscriptions = _.where(transaction.items, {
            type: 'subscription'
        });

        transaction.subscriptions = [];

        _.each(subscriptions, function(subscription) {
            var i = subscription.quantity;

            while (i--) {
                transaction.subscriptions.push(_.omit(subscription, ['taxable']));
            }
        });

        return Utility.async(transaction).fulfilled;
    },

    createDiscounts: function(transaction) {
        var discounts = _.where(transaction.items, {
                type: 'gift'
            }),
            generateCode = function(salt, i) {
                var code = salt,
                    possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

                while (i--) {
                    code += possible.charAt(Math.floor(Math.random() * possible.length));
                }

                return code;
            };

        transaction.discounts = [];

        _.each(discounts, function(discount) {
            var i = discount.quantity,
                newDiscount;

            discount.discounts = [];

            while (i--) { // Users can purchase multiple of each gift certificate, so generate as many discounts as required by discount.quantity
                newDiscount = {
                    active: true,
                    code: generateCode(transaction.transactionCount + '-' + transaction.userEmail + '-', 3),
                    created: moment().format(),
                    expiration: moment().add(5, 'year').format(),
                    minSubtotal: 0,
                    type: 'value',
                    useCount: 0,
                    uses: 1,
                    value: discount.discount,
                    price: discount.price,
                    priceAdjusted: discount.priceAdjusted,
                    userId: transaction.userId,
                    slug: discount.slug
                };

                transaction.discounts.push(newDiscount);
                discount.discounts.push(newDiscount)
            }

        });

        return Utility.async(transaction).fulfilled;
    },

    createShipments: function(transaction) {
        var shippedItems = _.where(transaction.items, {
                shipped: true
            }),
            totalCount = shippedItems.length,
            counter = 0,
            now = moment().format();


        transaction.shipments = _.map(shippedItems, function(item) {
            counter += 1;
            return {
                counter: counter,
                totalCount: totalCount,
                item: item,
                created: now,
                email: transaction.userEmail,
                transaction: _.pick(transaction, ['user', 'address', 'internationalAllowed', 'subtotal', 'tax', 'taxable', 'taxPercentage', 'shipping', 'domesticShipping', 'internationalShipping'])
            }
        });

        return Utility.async(transaction).fulfilled;
    },

    createDownloads: function(transaction) {
        var downloads = _.where(transaction.items, {
                type: 'digital'
            }),
            resourcesRef = FirebaseService.getResources(),
            resourceDeferred = Q.defer(),
            promises = [];


        if (downloads && downloads.length) {
            transaction.downloads = [];
        }

        _.each(downloads, function(item) {

            var i = item.quantity;

            while (i--) {
                transaction.downloads.push(item);
            }

        });

        return Utility.async(transaction).fulfilled;
    },

    saveTransaction: function(transaction) {
        var deferred = Q.defer(),
            codesDeferred = Q.defer(),
            subscriptionsDeferred = Q.defer(),
            giftsDeferred = Q.defer(),
            shippingDeferred = Q.defer(),
            downloadsDeferred = Q.defer(),
            transactionDeferred = Q.defer(),
            promises = [codesDeferred.promise, subscriptionsDeferred.promise, giftsDeferred.promise, shippingDeferred.promise, downloadsDeferred.promise, transactionDeferred.promise],
            now = moment().format(),
            unix = moment().unix(),
            logsRef = FirebaseService.getLogs(),
            userRef = FirebaseService.getUser(transaction.userId);

        /*
         * Increment useCount for any codes
         * Save discount use to log
         * Save subscriptions to user 
         * Save subscriptions to log
         * Save gift discounts to user
         * Save gift discounts
         * Save shipments to user
         * Save shipments to log
         * Save downloads to user
         * Save downloads
         * Save transaction
         */

        /*
         * Increment code useCounts and log to logs.discounts
         */
        var codePromises = [];
        _.each(transaction.codes, function(code) { // Increment code useCounts and log the use
            var useCountRef = FirebaseService.getDiscounts().child(code.key).child('useCount'),
                discountLogRef = logsRef.child('discounts').push(),
                codeDeferred = Q.defer(),
                userCodeDeferred = Q.defer();

            codePromises.push(userCodeDeferred.promise);

            FirebaseService.authWithSecret(useCountRef).then(function(ref) {
                ref.once('value', function(snapshot) {
                    var newUseCount = parseInt(snapshot.val()) + 1;

                    useCountRef.setWithPriority(newUseCount, unix, function(err) {
                        if (err) {
                            codeDeferred.reject(err);
                        } else {
                            code.useCount = newUseCount;
                            code.user = transaction.user;
                            code.date = now;

                            FirebaseService.authWithSecret(discountLogRef).then(function(ref) {
                                ref.setWithPriority(code, unix, function(err) {
                                    return err ? codeDeferred.reject(err) : codeDeferred.resolve(code);
                                });

                            });
                        }

                    });
                });

                return codeDeferred.promise;

            }).then(function(code) {
                if (!code.userId) {
                    return userCodeDeferred.resolve(code);
                } else {
                    FirebaseService.getUserGifts(userRef.key()).orderByChild('code').equalTo(code.code).once('value', function(snap) {
                        snap.forEach(function(codeSnap) {
                            codeSnap.ref().child('useCount').set(code.useCount, function(err) {
                                return err ? userCodeDeferred.reject(err) : userCodeDeferred.resolve();
                            });
                        });
                    });

                }

            });

        });
        Q.all(codePromises).then(codesDeferred.resolve, codesDeferred.reject);


        /*
         * Save subscription to user and log to logs.subscriptions
         */
        var subscriptionPromises = [];
        _.each(transaction.subscriptions, function(subscription) {
            var subscriptionRef = FirebaseService.getUserSubscriptions(userRef.key()).push(),
                subscriptionLogRef = logsRef.child('subscriptions').push(),
                subscriptionDeferred = Q.defer();

            subscriptionPromises.push(subscriptionDeferred);

            subscription.keys = {
                log: subscriptionLogRef.key(),
                user: subscriptionRef.key()
            };

            delete subscription.$id;
            subscriptionRef.setWithPriority(subscription, unix, function(err) {
                if (err) {
                    subscriptionDeferred.reject(err);
                } else {
                    subscription.user = transaction.user;
                    subscription.date = now;
                    subscription.email = transaction.userEmail;
                    FirebaseService.authWithSecret(subscriptionLogRef).then(function(ref) {
                        ref.setWithPriority(subscription, unix, function(err) {
                            return err ? subscriptionDeferred.reject(err) : subscriptionDeferred.resolve();
                        });

                    });

                }

            });

        });
        Q.all(subscriptionPromises).then(subscriptionsDeferred.resolve, subscriptionsDeferred.reject);

        /*
         * Save gift discounts array and then save gift to user
         */
        var discountPromises = [];
        _.each(transaction.discounts, function(discount) {
            var giftRef = FirebaseService.getUserGifts(userRef.key()).push(),
                discountRef = FirebaseService.getDiscounts().push(),
                discountDeferred = Q.defer();

            discountPromises.push(discountDeferred);
            discount.keys = {
                discount: discountRef.key(),
                user: giftRef.key()
            };
            FirebaseService.authWithSecret(discountRef).then(function(ref) {
                ref.setWithPriority(discount, unix, function(err) {
                    if (err) {
                        discountDeferred.reject(err);
                    } else {
                        giftRef.setWithPriority(discount, unix, function(err) {
                            return err ? discountDeferred.reject : discountDeferred.resolve();
                        });
                    }

                });

            });

        });
        Q.all(discountPromises).then(giftsDeferred.resolve, giftsDeferred.reject);

        /*
         * Save shipments to user and log to logs.shipments
         */
        var shipmentPromises = [];
        _.each(transaction.shipments, function(shipment) {
            var shipmentRef = FirebaseService.getUserShipments(userRef.key()).push(),
                shipmentLogRef = logsRef.child('shipments').push(),
                shipmentDeferred = Q.defer();

            shipmentPromises.push(shipmentDeferred);

            shipment.keys = {
                log: shipmentLogRef.key(),
                user: shipmentRef.key()
            };

            shipmentRef.setWithPriority(shipment, unix, function(err) {
                if (err) {
                    shipmentDeferred.reject(err);
                } else {
                    FirebaseService.authWithSecret(shipmentLogRef).then(function(ref) {
                        ref.setWithPriority(shipment, unix, function(err) {
                            return err ? shipmentDeferred.reject(err) : shipmentDeferred.resolve();
                        });
                    });
                }
            });

        });
        Q.all(shipmentPromises).then(shippingDeferred.resolve, shippingDeferred.reject);

        /*
         * Save downloads to user and to resources
         */
        var downloadPromises = [];
        _.each(transaction.downloads, function(download) {
            var downloadRef = FirebaseService.getUserDownloads(userRef.key()).push(),
                resourceRef = FirebaseService.getResources().push(),
                downloadDeferred = Q.defer(),
                resource = {
                    uri: download.downloadUri || false,
                    date: now,
                    keys: {
                        resource: resourceRef.key(),
                        user: downloadRef.key()
                    }
                };

            downloadPromises.push(downloadDeferred);

            download.resource = resource;
            FirebaseService.authWithSecret(downloadRef).then(function(ref) {
                ref.setWithPriority(download, unix, function(err) {
                    if (err) {
                        downloadDeferred.reject(err);
                    } else {
                        // resource.user = transaction.user;
                        resource.userEmail = transaction.userEmail;
                        resourceRef.setWithPriority(resource, unix, function(err) {
                            return err ? downloadDeferred.reject(err) : downloadDeferred.resolve();
                        });

                    }
                });

            });
        });
        Q.all(downloadPromises).then(downloadsDeferred.resolve, downloadsDeferred.reject);

        /*
         * Save transaction
         */
        var transactionRef = FirebaseService.getUserTransactions(userRef.key()).push(),
            transactionLogRef = logsRef.child('transactions').push(),
            cleanedTransaction = _.omit(transaction, ['discounts', 'downloads', 'shipments', 'subscriptions', 'user']),
            keys = {
                user: transactionRef.key(),
                log: transactionLogRef.key()
            };

        transaction.keys = keys;
        cleanedTransaction.keys = keys;

        transactionRef.setWithPriority(cleanedTransaction, unix, function(err) {
            if (err) {
                transactionDeferred.reject(err);
            } else {
                FirebaseService.authWithSecret(transactionLogRef).then(function(ref) {
                    ref.setWithPriority(cleanedTransaction, unix, function(err) {
                        return err ? transactionDeferred.reject(err) : transactionDeferred.resolve(transaction);
                    });

                });
            }
        });


        // codesDeferred.promise.then(function () {
        // 	console.log('codes saved');
        // }, function (err) {
        // 	console.log('codes err', err);
        // });

        // subscriptionsDeferred.promise.then(function () {
        // 	console.log('subscriptions saved');
        // }, function (err) {
        // 	console.log('subscriptions err', err);
        // });

        // giftsDeferred.promise.then(function () {
        // 	console.log('gifts saved');
        // }, function (err) {
        // 	console.log('gifts err', err);
        // });

        // shippingDeferred.promise.then(function () {
        // 	console.log('shipping saved');
        // }, function (err) {
        // 	console.log('shipping err', err);
        // });

        // downloadsDeferred.promise.then(function () {
        // 	console.log('downloads saved');
        // }, function (err) {
        // 	console.log('downloads err', err);
        // });

        // transactionDeferred.promise.then(function () {
        // 	console.log('transaction saved');
        // }, function (err) {
        // 	console.log('transaction err', err);
        // });

        // console.log('******************************************');
        // console.log(transaction);
        Q.all(promises).then(function() {
            deferred.resolve(transaction);
        }, deferred.reject);

        return deferred.promise;
    },

    updateTransaction: function(transaction) {
        var deferred = Q.defer(),
            transactionRef = FirebaseService.getTransaction(transaction.keys.log),
            userTransactionRef = FirebaseService.getUserTransaction(transaction.keys.user, transaction.keys.log),
            cleanedTransaction = _.omit(transaction, '$id', '$priority'),
            unix = moment().unix();

        cleanedTransaction.updated = moment().format();

        userTransactionRef.setWithPriority(cleanedTransaction, unix, function(err) {
            if (err) {
                deferred.reject(err);
            } else {
                transactionRef.setWithPriority(cleanedTransaction, unix, function(err) {
                    return err ? deferred.reject(err) : deferred.resolve(transaction);
                });
            }
        });

        return deferred.promise;
    },

    sendTransactionEmail: function(transaction) {
        var deferred = Q.defer(),
            textDeferred = Q.defer(),
            htmlDeferred = Q.defer(),
            key = transaction.keys.log,
            unix = moment().unix(),
            contentServer = 'http://127.0.0.1:' + ConfigService.get('private.content.port');

        request.get(contentServer + '/transaction/' + key + '/email/text').end(function(err, res) {
            if (err) {
                LogService.error('sendTransactionEmail txt', err);
                return textDeferred.reject(err);
            } else {
                return textDeferred.resolve(res.text);
            }
        });

        request.get(contentServer + '/transaction/' + key + '/email/html').end(function(err, res) {
            if (err) {
                LogService.error('sendTransactionEmail html', err);
                return htmlDeferred.reject(err);
            } else {
                return htmlDeferred.resolve(res.text);
            }
        });

        Q.all([textDeferred.promise, htmlDeferred.promise]).spread(function(text, html) {
            var config = ConfigService.get('private.email'),
                context = {
                    text: text,
                    html: html,
                    to: [{
                        "email": transaction.userEmail,
                        "name": transaction.userName,
                        "type": "to"
                    }],
                    tags: ['transaction-success'],
                    subject: config.subjects.transaction
                };

            EmailService.sendEmail(context, function(err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    transaction.email = result;
                    FirebaseService.getTransaction(transaction.keys.log).child('email').push().setWithPriority(result, unix, function(err) {
                        return err ? deferred.reject(err) : deferred.resolve(transaction);
                    });
                }

            });
        }, deferred.reject);

        return deferred.promise;
    }
};