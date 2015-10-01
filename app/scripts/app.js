'use strict';

angular.module('quiverCmsApp', [
    'ngSanitize',
    'ui.router',
    'firebase',
    'angular-markdown-editable',
    'slugifier',
    'restangular',
    'quiver.angular-utilities',
    'quiver.angularfire-authentication',
    'angular-md5',
    'ngStorage',
    'flow',
    'angular-google-analytics',
    'ngMaterial'
]).run(function($rootScope, $state, Restangular, NotificationService, env, Analytics, qvAuth, AdminService, $localStorage, $timeout) {
    var stateChangeSuccessOff,
        handleStateChangeSuccess = function() {
            $timeout(function() {
                var config;
                if ($localStorage.userId) {
                    config = {
                        userId: $localStorage.userId
                    };
                }

                Analytics.createAnalyticsScriptTag(config);
                stateChangeSuccessOff();
            });

        };

    /*
     * State change events
     */
    stateChangeSuccessOff = $rootScope.$on('$stateChangeSuccess', handleStateChangeSuccess);

    $rootScope.$on('$stateChangeStart', function(e, toState, toParams, fromState, fromParams) {
        $state.previous = _.clone($state);
        $state.toState = toState;
        $state.toParams = toParams;
        $state.fromState = fromState;
        $state.fromParams = fromParams;
    });

    $rootScope.$on('$stateChangeSuccess', function(e, toState, toParams, fromState, fromParams) {
        $timeout(function() {
            $rootScope.$emit('$stateChangeRender');
        });

    });

    /*
     * Auth
     */
    qvAuth.auth.$onAuth(function(authData) {

        if (authData && authData.uid) {
            // Make sure that the user has been created and redirect if needed
            AdminService.getApiUser(qvAuth.getHeaders(authData)).then(function() {
                if (~AdminService.loggedOutStates.indexOf($state.toState.name)) {
                    AdminService.redirect();
                }
            });
        }
    });

    /*
     * Env check
     */
    Restangular.one('env').get().then(function(res) {}, function(error) {
        NotificationService.error('Server Unresponsive', 'The server could not be reached at ' + env.api + '. Try reloading the page or come back later.');
    });

    /*
     * Reload
     */
    if (env.environment === 'development') {
        var reloadRef = AdminService.getReload();
        reloadRef.$loaded().then(function() {
            reloadRef.$watch(function() {
                location.reload();
            });
        });
    }


}).config(function($locationProvider, $stateProvider, $urlRouterProvider, AngularFireAuthenticationProvider, quiverUtilitiesProvider, RestangularProvider, flowFactoryProvider, AnalyticsProvider, $mdThemingProvider) {
    /*
     * HTML5 Mode
     */
    if (window.envVars.html5Mode) {
        $locationProvider.html5Mode(true).hashPrefix('!');
    }

    /*
     * Configure Restangular
     */
    RestangularProvider.setBaseUrl(window.envVars.api);

    /*
     * Configure Notifications
     */
    quiverUtilitiesProvider.setNotificationConfig(window.envVars.notification);

    /*
     * Configure Environment
     */
    quiverUtilitiesProvider.setEnv(window.envVars);

    /*
     * Configure qvAuth
     */
    AngularFireAuthenticationProvider.setEndpoint(window.envVars.firebase.endpoint);

    /*
     * Configure Default Route
     */
    $urlRouterProvider.otherwise('/app/');

    /*
     * Analytics
     */
    if (window.envVars.google && window.envVars.google.analyticsId) {
        AnalyticsProvider.setAccount(window.envVars.google.analyticsId);
        AnalyticsProvider.trackPages(true);
        AnalyticsProvider.useAnalytics(true);
        AnalyticsProvider.ignoreFirstPageLoad(false);
        AnalyticsProvider.useECommerce(true, true);
        AnalyticsProvider.setPageEvent('$stateChangeSuccess');
        AnalyticsProvider.delayScriptTag(true);
        AnalyticsProvider.useEnhancedLinkAttribution(true);
    }

    /*
     * Angular Material
     */
    var palette = window.envVars.theme && window.envVars.theme.palette ? window.envVars.theme.palette : false,
        isValidCustomPalette = function(palette) {
            var required = [
                    "50",
                    "100",
                    "200",
                    "300",
                    "400",
                    "500",
                    "600",
                    "700",
                    "800",
                    "900",
                    "A100",
                    "A200",
                    "A300",
                    "A400",
                    "A700",
                    "contrastDarkColors",
                    "contrastLightColors",
                    "contrastDefaultColor"
                ],
                keys = Object.keys(palette),
                i = required.length;
            while (i--) {
                if (!~keys.indexOf(required[i])) {
                    return false
                }
            }
            return true;
        };



    if (palette) {
        var theme = $mdThemingProvider.theme('default');

        if (palette.primary && palette.overrides && palette.overrides.primary) { // Extend a palette
            var customPrimary = $mdThemingProvider.extendPalette(palette.primary, palette.overrides.primary);
            $mdThemingProvider.definePalette('customPrimary', customPrimary);
            if (palette.intentions && palette.intentions.primary) {
                theme.primaryPalette('customPrimary', palette.intentions.primary);
            } else {
                theme.primaryPalette('customPrimary');
            }
        } else if (palette.primary && palette.intentions && palette.intentions.primary) { // Use a predefined Palette with custom intentions
            theme.primaryPalette(palette.primary, palette.intentions.primary);
        } else if (palette.primary) { // Use an unmodified palette
            theme.primaryPalette(palette.primary);
        } else if (palette.overrides && palette.overrides.primary && isValidCustomPalette(palette.overrides.primary)) { // Create a palette
            $mdThemingProvider.definePalette('customPrimary', palette.overrides.primary);
            theme.primaryPalette('customPrimary');
        }

        if (palette.accent && palette.overrides && palette.overrides.accent) { // Extend a palette
            var customAccent = $mdThemingProvider.extendPalette(palette.accent, palette.overrides.accent);
            $mdThemingProvider.definePalette('customAccent', customAccent);
            if (palette.intentions && palette.intentions.accent) {
                theme.accentPalette('customPrimary', palette.intentions.accent);
            } else {
                theme.accentPalette('customAccent');
            }
        } else if (palette.accent && palette.intentions && palette.intentions.accent) { // Use a predefined Palette with custom intentions
            theme.accentPalette(palette.accent, palette.intentions.accent);
        } else if (palette.accent) { // Use an unmodified Palette
            theme.accentPalette(palette.accent);
        } else if (palette.overrides && palette.overrides.accent && isValidCustomPalette(palette.overrides.accent)) { // Create a palette
            $mdThemingProvider.definePalette('customAccent', palette.overrides.accent);
            theme.accentPalette('customAccent');
        }

        if (palette.dark) {
            theme.dark();
        }

    }


    /*
     * Configure states
     */
    var states = {
        master: {
            url: '/app',
            abstract: true,
            templateUrl: 'views/master.html',
            controller: 'MasterCtrl',
            resolve: {
                currentUser: function(qvAuth) {
                    return qvAuth.getCurrentUser();
                },
                settings: function($q, AdminService) {
                    return AdminService.getSettings().$loaded();
                },
                user: function($q, $state, qvAuth, AdminService) {
                    /*
                     * The user may be logged in, but hit the page without auth,
                     * so currentUser was not resolved on the initial page load.
                     */
                    return qvAuth.getCurrentUser().then(function(currentUser) {
                        if (!currentUser || !currentUser.uid) {
                            return qvAuth.getResolvedPromise();
                        }

                        var headers = qvAuth.getHeaders(currentUser);

                        RestangularProvider.setDefaultHeaders(headers);
                        flowFactoryProvider.defaults = {
                            headers: headers,
                            testChunks: false
                        };

                        return AdminService.getApiUser(headers);

                    }).then(function(data) {
                        return !data ? qvAuth.getResolvedPromise() : qvAuth.getUser(data.key);
                    });

                }
            }
        },
        masterNav: {
            abstract: true,
            views: {
                sidenavLeft: {
                    templateUrl: 'views/sidenav-left.html'
                },
                body: {
                    templateUrl: 'views/body.html'
                },
                footer: {
                    templateUrl: 'views/footer.html'
                }
            }
        },
        masterNavLogin: {
            url: '/login',
            templateUrl: 'views/login.html',
            controller: 'AuthCtrl'
        },
        masterNavRegister: {
            url: '/register',
            templateUrl: 'views/register.html',
            controller: 'AuthCtrl'
        },
        masterNavReset: {
            url: '/reset',
            templateUrl: 'views/reset.html',
            controller: 'AuthCtrl'
        },
        masterNavCart: {
            url: '/cart',
            templateUrl: 'views/cart.html',
            controller: 'CartCtrl',
            resolve: {
                products: function(AdminService, $q) {
                    return AdminService.getProducts().$loaded();
                },
                countriesStatus: function(AdminService, $q) {
                    return AdminService.getCountries().$loaded();
                },
                statesStatus: function(AdminService, $q) {
                    return AdminService.getStates().$loaded();
                },
                shipping: function(AdminService) {
                    return AdminService.getShipping();
                },
                clientToken: function() {
                    return false;
                }
            }
        },
        authenticated: { // *************************************************  Authentication  ******************
            abstract: true,
            templateUrl: 'views/authenticated.html',
            controller: 'AuthenticatedCtrl',
            resolve: {
                user: function($q, $state, qvAuth, $localStorage, AdminService) {
                    return qvAuth.getCurrentUser().then(function(currentUser) {
                        if (!currentUser || !currentUser.uid) {
                            // Dump users without auth to login.
                            $localStorage.redirect = {
                                toState: $state.toState,
                                toParams: $state.toParams
                            };
                            return $state.go('master.nav.login');
                        }

                        var headers = qvAuth.getHeaders(currentUser);

                        RestangularProvider.setDefaultHeaders(headers);
                        flowFactoryProvider.defaults = {
                            headers: headers,
                            testChunks: false
                        };

                        return AdminService.getApiUser(headers);

                    }).then(function(data) {
                        return data && data.key ? qvAuth.getUser(data.key) : qvAuth.getRejectedPromise();
                    });

                }
            }
        },
        authenticatedMaster: {
            url: '/app',
            abstract: true,
            templateUrl: 'views/master.html',
            controller: 'MasterCtrl',
            resolve: {
                currentUser: function(qvAuth) {
                    return qvAuth.getCurrentUser();
                },
                settings: function(AdminService) {
                    return AdminService.getSettings().$loaded();
                }
            }
        },
        authenticatedMasterNav: {
            abstract: true,
            views: {
                sidenavLeft: {
                    templateUrl: 'views/sidenav-left.html',
                    controller: 'NavCtrl',
                    resolve: {
                        subscriptions: function(UserService, user) {
                            return UserService.getSubscriptions(user.$id);
                        }
                    }
                },
                body: {
                    templateUrl: 'views/body.html'
                },
                footer: {
                    templateUrl: 'views/footer.html'
                }
            }
        },
        authenticatedMasterNavDashboard: {
            url: '/',
            templateUrl: 'views/dashboard.html',
            controller: 'DashboardCtrl',
            resolve: {
                assignments: function(UserService, user) {
                    return UserService.getSubmittedAssignments(user.$id, {
                        orderByKey: true
                    }).$loaded();
                },
                subscriptions: function(UserService, user) {
                    return UserService.getSubscriptions(user.$id).$loaded();
                },
                shipments: function(UserService, user) {
                    return UserService.getShipments(user.$id).$loaded();
                },
                gifts: function(UserService, user) {
                    return UserService.getGifts(user.$id).$loaded();
                },
                downloads: function(UserService, user) {
                    return UserService.getDownloads(user.$id).$loaded();
                },
                transactions: function(UserService, user) {
                    return UserService.getTransactions(user.$id).$loaded();
                },
                surveyResponses: function(UserService, user) {
                    return UserService.getSurveyResponses(user.$id);
                },
                archivedGalleries: function (UserService, user) {
                    return UserService.getArchivedGalleries(user.$id);
                }
            }
        },
        authenticatedMasterNavAccount: { // ******************************  Account **************************
            url: "/account",
            templateUrl: 'views/account.html',
            controller: 'AccountCtrl',
            resolve: {
                userPublic: function(UserService, user) {
                    return UserService.getPublic(user.$id);
                },
                userPreferredEmail: function(UserService, user) {
                    return UserService.getPreferredEmail(user.$id);
                },
                userName: function(UserService, user) {
                    return UserService.getName(user.$id);
                }
            }
        },
        authenticatedMasterNavCheckout: { // *****************************  Checkout *************************
            url: "/checkout",
            templateUrl: 'views/checkout.html',
            controller: 'CartCtrl',
            resolve: {
                products: function(AdminService, $q) {
                    return AdminService.getProducts().$loaded();
                },
                countriesStatus: function(AdminService, $q) {
                    return AdminService.getCountries().$loaded();
                },
                statesStatus: function(AdminService, $q) {
                    return AdminService.getStates().$loaded();
                },
                shipping: function(AdminService) {
                    return AdminService.getShipping();
                },
                clientToken: function(CommerceService, user) {
                    return CommerceService.getClientToken();
                }

            }
        },
        authenticatedMasterNavTransaction: { // **************************  Transaction **********************
            url: "/user/:userId/transaction/:key",
            templateUrl: 'views/transaction.html',
            controller: 'UserTransactionCtrl',
            resolve: {
                transaction: function(UserService, $stateParams, $state, qvAuth, user) {
                    if (!qvAuth.verifyUser($stateParams.userId, user)) {
                        $state.go('authenticated.master.nav.dashboard');

                    } else {
                        return UserService.getTransaction($stateParams.userId, $stateParams.key);
                    }

                }
            }
        },
        authenticatedMasterNavMessages: { // *****************************  Messages *************************
            abstract: true,
            templateUrl: 'views/messages.html',
            controller: 'MessagesCtrl',
            resolve: {
                messageable: function(AdminService, user) {
                    return AdminService.getMessageable();
                    // if (user && user.isAdmin) {
                    //     return AdminService.getUsers({
                    //         orderByChild: 'email'
                    //     });
                    // } else {

                    // }

                },
                sentMessages: function(UserService, user) {
                    return UserService.getSentMessages(user.$id);
                },
                receivedMessages: function(UserService, user) {
                    return UserService.getReceivedMessages(user.$id);
                }
            }
        },
        authenticatedMasterNavMessagesList: { // *****************************  Messages *************************
            url: '/messages',
            templateUrl: 'views/messages-list.html'
        },
        authenticatedMasterSubscription: { // **********************************  Table of Contents ****************
            abstract: true,
            url: "/subscription/:subscriptionKey",
            views: {
                sidenavLeft: {
                    templateUrl: 'views/sidenav-left.html',
                    controller: 'NavCtrl',
                    resolve: {
                        subscriptions: function(UserService, user) {
                            return UserService.getSubscriptions(user.$id);
                        }
                    }
                },
                sidenavRight: {
                    templateUrl: 'views/sidenav-subscription.html',
                    controller: 'UserSubscriptionCtrl',
                    resolve: {
                        subscription: function(UserService, user, $stateParams) {
                            return UserService.getSubscription(user.public.id, $stateParams.subscriptionKey);
                        },
                        pages: function(user, UserService, $stateParams) {
                            return UserService.getPages(user.public.id, $stateParams.subscriptionKey);
                        },
                        assignments: function(UserService, user, $stateParams) {
                            return UserService.getAssignments(user.public.id, $stateParams.subscriptionKey);
                        }
                    }
                },
                body: {
                    templateUrl: 'views/body.html'
                },
                footer: {
                    templateUrl: 'views/footer.html'
                }
            }
        },
        authenticatedMasterSubscriptionPage: { // *********************  User Subscription ****************
            url: "/page/:pageNumber",
            templateUrl: '/views/page.html',
            controller: 'PageCtrl',
            resolve: {
                isActive: function(UserService, user, $stateParams, $q, NotificationService, $state) {
                    var deferred = $q.defer();

                    UserService.getSubscription(user.public.id, $stateParams.subscriptionKey).$loaded()
                        .then(function(subscription) {
                            if (subscription.subscriptionType === 'interaction') {
                                return deferred.resolve(true);
                            } else {
                                return UserService.subscriptionIsExpired(subscription, true);
                            }
                        }).then(function(isExpired) {
                            if (isExpired) {
                                NotificationService.notify('Subscription Expired');
                                return $state.go('authenticated.master.nav.dashboard');
                            } else {
                                deferred.resolve(true);
                            }
                        });

                    return deferred.promise;

                },
                word: function(AdminService, UserService, user, $stateParams, $localStorage, $rootScope) {
                    $localStorage.lastSubscriptionKey = $stateParams.subscriptionKey; // Necessary to find user assignments by slug

                    return UserService.getPages(user.public.id, $stateParams.subscriptionKey).then(function(pages) {
                        var key = pages[$stateParams.pageNumber].$id;

                        $rootScope.assignmentKey = undefined;
                        $rootScope.pageNumber = parseInt($stateParams.pageNumber);
                        $localStorage['bookmark-' + $stateParams.subscriptionKey] = parseInt($stateParams.pageNumber);
                        return AdminService.getWord(key);

                    });

                },
                pages: function(user, UserService, $stateParams) {
                    return UserService.getPages(user.public.id, $stateParams.subscriptionKey);
                }
            }
        },
        authenticatedMasterSubscriptionAssignment: {
            url: "/assignment/:assignmentKey",
            templateUrl: '/views/assignment.html',
            controller: 'UserAssignmentCtrl',
            resolve: {
                assignment: function(AdminService, UserService, user, $stateParams, $localStorage, $rootScope, $q, NotificationService, $state) {
                    var deferred = $q.defer(),
                        assignment;

                    AdminService.getAssignment($stateParams.assignmentKey).$loaded()
                        .then(function(serverAssignment) {
                            assignment = serverAssignment;
                            return UserService.getSubscription(user.public.id, $stateParams.subscriptionKey).$loaded();
                        })
                        .then(function(subscription) {
                            return UserService.subscriptionIsExpired(subscription, false);
                        })
                        .then(function(isExpired) {
                            if (isExpired && assignment.startsSubscription) {
                                NotificationService.notify('Subscription Expired');
                                return $state.go('authenticated.master.subscription.page', {
                                    subscriptionKey: $stateParams.subscriptionKey,
                                    pageNumber: 0
                                });
                            } else {
                                $rootScope.pageNumber = undefined;
                                $rootScope.assignmentKey = $stateParams.assignmentKey;
                                $localStorage['assignment-' + $stateParams.assignmentKey] = $stateParams.assignmentKey;
                                deferred.resolve(assignment);
                            }
                        });

                    return deferred.promise;
                },
                userAssignment: function(UserService, user, $stateParams) {
                    return UserService.getAssignment(user.public.id, $stateParams.assignmentKey);
                },
                userAssignmentUploads: function(UserService, user, $stateParams) {
                    return UserService.getAssignmentUploads(user.public.id, $stateParams.assignmentKey);
                },
                userAssignmentMessages: function(UserService, user, $stateParams) {
                    return UserService.getAssignmentMessages(user.public.id, $stateParams.assignmentKey);
                },
                notifications: function(AdminService, currentUser) {
                    return AdminService.getNotifications(currentUser.uid);
                }
            }
        },
        authenticatedMasterFindassignment: {
            url: '/find-assignment/:slug',
            templateUrl: '/views/find-assignment.html',
            controller: 'FindAssignmentCtrl',
            resolve: {
                assignment: function (AdminService, $stateParams, $q, _) {
                    return AdminService.getAllAssignments().$loaded().then(function (assignments) {
                        var deferred = $q.defer();

                        deferred.resolve(_.find(assignments, {slug: $stateParams.slug}));

                        return deferred.promise;
                    });
                },
                subscriptions: function (UserService, user) {
                    return UserService.getSubscriptions(user.public.id).$loaded();  
                }
            }
        },
        authenticatedMasterArchivedGallery: {
            url: "/archived-gallery/:key",
            templateUrl: "/views/archived-gallery.html",
            controller: "ArchivedGalleryCtrl",
            resolve: {
                gallery: function (UserService, user, $stateParams) {
                    return UserService.getArchivedGallery(user.$id, $stateParams.key);
                },
                comments: function (UserService, user, $stateParams) {
                    return UserService.getArchivedGalleryComments(user.$id, $stateParams.key);
                }
            }
        },
        authenticatedMasterAdmin: { // ************************************  Admin ****************************
            abstract: true,
            url: '/admin',
            views: {
                sidenavLeft: {
                    templateUrl: 'views/sidenav-left-admin.html'
                },
                sidenavRight: {
                    templateUrl: 'views/sidenav-gallery.html',
                    controller: 'ListCtrl',
                    resolve: {
                        items: function(AdminService) {
                            return AdminService.getOriginals().$limit(5).$default().$get();
                        }
                    }
                },
                body: {
                    templateUrl: 'views/body.html',
                    controller: "AdminCtrl",
                    resolve: {
                        isAdmin: function(user, $state) {
                            if ($state.toState && $state.current.name.match(/moderator/) && $state.toState.name !== 'authenticated.master.admin.dashboard') {
                                $state.go($state.toState.name.replace(/admin/, 'moderator'), $state.toParams);
                                return false
                            } else if (!user.isAdmin) {
                                $state.go('authenticated.master.nav.dashboard');
                                return false;
                            } else {
                                return true;
                            }
                        },
                        theme: function(AdminService) {
                            return AdminService.getTheme();
                        },
                        settings: function(AdminService) {
                            return AdminService.getSettings();
                        },
                        adminSettings: function(AdminService) {
                            return AdminService.getAdminSettings();
                        }
                    }
                }
            }
        },
        authenticatedMasterAdminDashboard: {
            url: '/dashboard',
            templateUrl: 'views/admin-dashboard.html',
            controller: 'AdminDashboardCtrl',
            resolve: {
                reports: function(AdminService) {
                    return AdminService.getReports();
                },
                backups: function(AdminService) {
                    return AdminService.getBackups();
                },
                products: function (AdminService) {
                    return AdminService.getAllProducts();
                }
            }
        },
        authenticatedMasterAdminWords: { // ******************************  Words ****************************
            abstract: true,
            templateUrl: 'views/admin-words.html',
            controller: 'WordsCtrl',
            resolve: {
                items: function(AdminService) {
                    return AdminService.getWords().$orderByKey().$limitToLast(10).$default().$get();
                },
                moderators: function(AdminService) {
                    return AdminService.getUsers().$orderByChild('isModerator').$equalTo(true).$default().$get();
                }
            }
        },
        authenticatedMasterAdminWordsList: {
            url: '/words',
            templateUrl: 'views/admin-words-list.html',
            controller: 'ListCtrl'
        },
        authenticatedMasterAdminWord: {
            url: '/words/:key',
            templateUrl: 'views/admin-word.html',
            controller: 'WordCtrl',
            resolve: {
                word: function(AdminService, $stateParams) {
                    return AdminService.getWord($stateParams.key);
                },
                drafts: function(AdminService, $stateParams) {
                    return AdminService.getDrafts($stateParams.key);
                },
                files: function(AdminService) {
                    return AdminService.getFiles().$loaded();
                },
                hashtags: function(AdminService) {
                    return AdminService.getHashtags();
                },
                wordHashtags: function(AdminService, $stateParams) {
                    return AdminService.getWordHashtags($stateParams.key);
                }
            }
        },
        authenticatedMasterAdminAssignments: { // ************************  Assignments **********************
            abstract: true,
            templateUrl: 'views/admin-assignments.html',
            controller: 'AssignmentsCtrl',
            resolve: {
                items: function(AdminService) {
                    return AdminService.getAssignments().$orderByKey().$limitToLast(10).$default().$get();
                }
            }
        },
        authenticatedMasterAdminAssignmentsList: {
            url: '/assignments',
            templateUrl: 'views/admin-assignments-list.html'
        },
        authenticatedMasterAdminAssignment: {
            url: '/assignment/:key',
            templateUrl: 'views/admin-assignment.html',
            controller: 'AssignmentCtrl',
            resolve: {
                products: function(AdminService) {
                    return AdminService.getProducts({
                        orderByChild: 'type',
                        equalTo: 'subscription'
                    });
                },
                assignment: function(AdminService, $stateParams) {
                    return AdminService.getAssignment($stateParams.key);
                }
            }
        },
        authenticatedMasterAdminFiles: { // ******************************  Files ****************************
            abstract: true,
            templateUrl: 'views/admin-files.html',
            controller: 'FilesCtrl',
            resolve: {
                bucket: function(AdminService) {
                    return AdminService.getBucket();
                },
                notifications: function(AdminService, user) {
                    return AdminService.getNotifications(user.$id);
                },
                items: function(AdminService) {
                    return AdminService.getOriginals().$get();
                }
            }
        },
        authenticatedMasterAdminFilesList: {
            url: '/files/:search',
            templateUrl: 'views/admin-files-list.html',
            controller: 'ListCtrl'
        },
        authenticatedMasterAdminProducts: { // ***************************  Products *************************
            url: '/products',
            templateUrl: 'views/admin-products.html',
            controller: 'ProductsCtrl',
            resolve: {
                items: function(AdminService) {
                    return AdminService.getProducts().$get();
                },
                files: function(AdminService) {
                    return AdminService.getFiles();
                }
            }
        },
        authenticatedMasterAdminProduct: {
            url: '/product/:key',
            templateUrl: 'views/admin-product.html',
            controller: 'ProductCtrl',
            resolve: {
                product: function(AdminService, $stateParams) {
                    return AdminService.getProduct($stateParams.key);
                },
                productImages: function(AdminService, $stateParams) {
                    return AdminService.getProductImages($stateParams.key);
                },
                productOptionGroups: function(AdminService, $stateParams) {
                    return AdminService.getProductOptionGroups($stateParams.key);
                },
                productOptionsMatrix: function(AdminService, $stateParams) {
                    return AdminService.getProductOptionsMatrix($stateParams.key);
                },
                files: function(AdminService) {
                    return AdminService.getFiles();
                },
                hashtags: function(AdminService) {
                    return AdminService.getHashtags();
                },
                productHashtags: function(AdminService, $stateParams) {
                    return AdminService.getProductHashtags($stateParams.key);
                }

            }
        },
        authenticatedMasterAdminUsers: { // ******************************  Users ****************************
            abstract: true,
            templateUrl: 'views/admin-users.html',
            controller: 'UsersCtrl',
            resolve: {
                messageable: function(AdminService) {
                    return AdminService.getMessageable();
                },
                items: function(AdminService) {
                    return AdminService.getUsers().$default().$get();
                }
            }
        },
        authenticatedMasterAdminUsersList: {
            url: '/users/:search',
            templateUrl: 'views/admin-users-list.html',
            controller: 'ListCtrl'
        },
        authenticatedMasterAdminUser: {
            url: '/user/:key',
            templateUrl: 'views/admin-user.html',
            controller: 'UserCtrl',
            resolve: {
                user: function(AdminService, $stateParams) {
                    return AdminService.getUser($stateParams.key);
                },
                assignments: function(AdminService) {
                    return AdminService.getAllAssignments();
                },
                products: function(AdminService) {
                    return AdminService.getAllProducts();
                },
                transactions: function(UserService, $stateParams) {
                    return UserService.getTransactions($stateParams.key);
                },
                subscriptions: function(UserService, $stateParams) {
                    return UserService.getSubscriptions($stateParams.key);
                },
                gifts: function(UserService, $stateParams) {
                    return UserService.getGifts($stateParams.key);
                },
                shipments: function(UserService, $stateParams) {
                    return UserService.getShipments($stateParams.key);
                },
                downloads: function(UserService, $stateParams) {
                    return UserService.getDownloads($stateParams.key);
                }
            }
        },
        authenticatedMasterAdminSettings: { // ***************************  Settings *************************
            url: '/settings',
            templateUrl: 'views/admin-settings.html',
            controller: 'SettingsCtrl',
            resolve: {
                landingPages: function(AdminService) {
                    return AdminService.getLandingPages().$limit(100000).$get();
                }
            }
        },
        authenticatedMasterAdminCommerce: {
            url: '/commerce',
            templateUrl: 'views/admin-commerce.html',
            controller: 'CommerceCtrl',
            resolve: {
                commerce: function(AdminService) {
                    return AdminService.getCommerce();
                },
                countries: function(CommerceService) {
                    return CommerceService.getCountries();
                },
                states: function(CommerceService) {
                    return CommerceService.getStates();
                },
            }
        },
        authenticatedMasterAdminSurveys: { // ****************************  Surveys **************************
            abstract: true,
            templateUrl: 'views/admin-surveys.html',
            controller: 'SurveysCtrl',
            resolve: {
                items: function(AdminService) {
                    return AdminService.getSurveys().$get();
                }
            }
        },
        authenticatedMasterAdminSurveysList: {
            url: '/surveys/:search',
            templateUrl: 'views/admin-surveys-list.html',
            controller: 'ListCtrl',
            resolve: {
                limit: function() {
                    return 10;
                },
                getRef: function(AdminService) {
                    return AdminService.getSurveys;
                },
                ref: function(AdminService, limit) {
                    return AdminService.getSurveys({
                        orderByKey: true,
                        limitToLast: limit
                    });
                }
            }
        },
        authenticatedMasterAdminSurvey: {
            url: '/survey/:key',
            templateUrl: 'views/admin-survey.html',
            controller: 'SurveyCtrl',
            resolve: {
                survey: function(AdminService, $stateParams) {
                    return AdminService.getSurvey($stateParams.key);
                },
                answers: function(AdminService, $stateParams) {
                    return AdminService.getSurveyAnswers($stateParams.key);
                }
            }
        },
        authenticatedMasterAdminDiscounts: { // **************************  Discounts ************************
            abstract: true,
            templateUrl: 'views/admin-discounts.html',
            controller: 'DiscountsCtrl',
            resolve: {
                items: function(AdminService) {
                    return AdminService.getDiscounts().$get();
                }
            }
        },
        authenticatedMasterAdminDiscountsList: {
            url: '/discounts/:search',
            templateUrl: 'views/admin-discounts-list.html',
            controller: 'ListCtrl'
        },
        authenticatedMasterAdminSocial: { // *****************************  Social ***************************
            url: '/social-media',
            templateUrl: 'views/admin-social.html',
            controller: 'SocialCtrl',
            resolve: {
                social: function(AdminService) {
                    return AdminService.getSocial();
                },
                instagramTerms: function(AdminService) {
                    return AdminService.getInstagramTerms();
                }
            }
        },
        authenticatedMasterAdminHashtags: { // ***************************  Hashtags *************************
            url: '/hashtags',
            templateUrl: 'views/admin-hashtags.html',
            controller: 'HashtagsCtrl',
            resolve: {
                hashtags: function(AdminService) {
                    return AdminService.getHashtags();
                }
            }
        },
        authenticatedMasterAdminTransactions: { // ***********************  Transactions *********************
            abstract: true,
            templateUrl: 'views/admin-transactions.html',
            controller: 'TransactionsCtrl',
            resolve: {
                items: function(AdminService) {
                    return AdminService.getTransactions().$get();
                }
            }
        },
        authenticatedMasterAdminTransactionsList: {
            url: '/transactions/:search',
            templateUrl: 'views/admin-transactions-list.html',
            controller: 'ListCtrl'
        },
        authenticatedMasterAdminTransaction: {
            url: '/transaction/:key/user/:userId',
            templateUrl: 'views/admin-transaction.html',
            controller: 'TransactionCtrl',
            resolve: {
                transaction: function(AdminService, $stateParams) {
                    return AdminService.getTransaction($stateParams.key);
                },
                userTransaction: function(UserService, $stateParams) {
                    return UserService.getTransaction($stateParams.userId, $stateParams.key);
                }
            }
        },
        authenticatedMasterAdminSubscriptions: { // ***********************  Subscriptions *******************
            abstract: true,
            templateUrl: 'views/admin-subscriptions.html',
            controller: 'SubscriptionsCtrl',
            resolve: {
                items: function(AdminService) {
                    return AdminService.getSubscriptions().$get();
                }
            }
        },
        authenticatedMasterAdminSubscriptionsList: {
            url: '/subscriptions/:search',
            templateUrl: 'views/admin-subscriptions-list.html',
            controller: 'ListCtrl'
        },
        authenticatedMasterAdminSubscription: { // ***********************  Subscriptions *******************
            url: '/subscription/:key',
            templateUrl: 'views/admin-subscription.html',
            controller: 'SubscriptionCtrl',
            resolve: {
                subscription: function(AdminService, $stateParams) {
                    return AdminService.getSubscription($stateParams.key);
                },
                userSubscription: function(UserService, subscription, $q) {
                    return subscription.$loaded().then(function(subscription) {
                        return UserService.getSubscription(subscription.user.public.id, subscription.keys.user);
                    });
                }
            }
        },
        authenticatedMasterAdminShipments: { // **************************  Shipments ************************
            abstract: true,
            templateUrl: 'views/admin-shipments.html',
            controller: 'ShipmentsCtrl',
            resolve: {
                items: function(AdminService) {
                    return AdminService.getShipments().$get();
                }
            }
        },
        authenticatedMasterAdminShipmentsList: {
            url: '/shipments/:search',
            templateUrl: 'views/admin-shipments-list.html',
            controller: 'ListCtrl'
        },
        authenticatedMasterAdminResources: { // **************************  Resources ************************
            abstract: true,
            templateUrl: 'views/admin-resources.html',
            controller: 'ResourcesCtrl',
            resolve: {
                items: function(AdminService) {
                    return AdminService.getResources().$get();
                }
            }
        },
        authenticatedMasterAdminResourcesList: {
            url: '/resources/:search',
            templateUrl: 'views/admin-resources-list.html',
            controller: 'ListCtrl'
        },
        authenticatedMasterAdminMessages: { // ***************************  Messages *************************
            abstract: true,
            templateUrl: 'views/admin-messages.html',
            controller: 'MessagesListCtrl',
            resolve: {
                items: function(AdminService) {
                    return AdminService.getMessages().$get();
                }
            }
        },
        authenticatedMasterAdminMessagesList: {
            url: '/messages/:search',
            templateUrl: 'views/admin-messages-list.html',
            controller: 'ListCtrl'
        },
        authenticatedMasterAdminUploads: { // ****************************  Uploads **************************
            abstract: true,
            templateUrl: 'views/admin-uploads.html',
            controller: 'UploadsCtrl',
            resolve: {
                items: function(AdminService) {
                    return AdminService.getUploads().$get();
                }
            }
        },
        authenticatedMasterAdminUploadsList: {
            url: '/uploads/:search',
            templateUrl: 'views/admin-uploads-list.html',
            controller: 'ListCtrl'
        },
        authenticatedMasterAdminFeedback: { // ***************************  Assignment ***********************
            url: '/user/:userId/feedback/:assignmentKey',
            templateUrl: 'views/admin-feedback.html',
            controller: 'FeedbackCtrl',
            resolve: {
                client: function(AdminService, $stateParams) {
                    return AdminService.getUser($stateParams.userId);
                },
                assignment: function(AdminService, $stateParams) {
                    return AdminService.getAssignment($stateParams.assignmentKey);
                },
                userAssignment: function(UserService, $stateParams) {
                    return UserService.getAssignment($stateParams.userId, $stateParams.assignmentKey);
                },
                assignmentUploads: function(UserService, $stateParams) {
                    return UserService.getAssignmentUploads($stateParams.userId, $stateParams.assignmentKey);
                },
                assignmentMessages: function(UserService, $stateParams) {
                    return UserService.getAssignmentMessages($stateParams.userId, $stateParams.assignmentKey);
                }
            }
        },
        authenticatedMasterAdminEmail: { // ******************************  Email Queue **********************
            abstract: true,
            templateUrl: 'views/admin-email.html',
            controller: 'EmailCtrl',
            resolve: {
                items: function(AdminService) {
                    return AdminService.getEmailQueue().$get();
                }
            }
        },
        authenticatedMasterAdminEmailList: {
            url: '/email',
            templateUrl: 'views/admin-email-list.html'
        },
        authenticatedMasterAdminLandingPages: { // ***********************  Landing Pages ********************
            url: '/landing-pages',
            templateUrl: 'views/admin-landing-pages.html',
            controller: 'LandingPagesCtrl',
            resolve: {
                items: function(AdminService) {
                    return AdminService.getLandingPages().$get();
                }
            }
        },
        authenticatedMasterAdminLandingPage: {
            url: '/landing-page/:key',
            templateUrl: 'views/admin-landing-page.html',
            controller: 'LandingPageCtrl',
            resolve: {
                page: function(AdminService, $stateParams) {
                    return AdminService.getLandingPage($stateParams.key);
                }
            }
        },
        authenticatedMasterAdminLogs: { // ********************************  Logs ****************************
            abstract: true,
            url: '/logs',
            template: '<div ui-view></div>'
        },
        authenticatedMasterAdminLogsType: {
            url: '/:type',
            templateUrl: '/views/admin-logs.html',
            controller: 'LogsCtrl',
            resolve: {
                logs: function (AdminService, user, $stateParams) {
                    return AdminService.getLogs($stateParams.type);
                }
            }
        },
        authenticatedMasterAdminTest: {
            url: '/test',
            templateUrl: '/views/admin-test.html',
            controller: 'TestCtrl'
        },
        authenticatedMasterModerator: { // ************************************  Moderator ********************
            abstract: true,
            url: '/moderator',
            views: {
                sidenavLeft: {
                    templateUrl: 'views/sidenav-left-moderator.html'
                },
                sidenavRight: {
                    templateUrl: 'views/sidenav-gallery.html',
                    controller: 'ListCtrl',
                    resolve: {
                        items: function(AdminService) {
                            return AdminService.getOriginals().$limit(5).$default().$get();
                        }
                    }
                },
                body: {
                    templateUrl: 'views/body.html',
                    controller: "ModeratorCtrl",
                    resolve: {
                        isModerator: function(user, $state) {
                            if (!user.isModerator) {
                                $state.go('authenticated.master.nav.dashboard');
                                return false;
                            } else {
                                return true;
                            }
                        }
                    }
                }
            }
        },
        authenticatedMasterModeratorDashboard: { // ***************************  Moderator ********************
            url: '/dashboard',
            templateUrl: 'views/moderator-dashboard.html',
            controller: 'ModeratorDashboardCtrl'
        },
        authenticatedMasterModeratorMessages: { // ***************************  Messages *************************
            abstract: true,
            templateUrl: 'views/moderator-messages.html',
            controller: 'ModeratorMessagesCtrl',
            resolve: {
                assignments: function(AdminService, $q, user, NotificationService, _) {
                    if (!user.permissions || !user.permissions.assignments) {
                        NotificationService.error('No assignments assigned.');
                        $state.go('authenticated.master.moderator.dashboard');
                        return false;
                    } else {
                        var deferred = $q.defer();

                        AdminService.getAllAssignments().$loaded().then(function(assignments) {
                            var keys = Object.keys(user.permissions.assignments),
                                i = keys.length,
                                allowed = [];

                            while (i--) {
                                if (user.permissions.assignments[keys[i]]) {
                                    allowed.push(keys[i]);
                                }
                            }

                            deferred.resolve(_.filter(assignments, function(assignment) {
                                return ~allowed.indexOf(assignment.$id);
                            }));
                        });

                        return deferred.promise;
                    }
                }
            }
        },
        authenticatedMasterModeratorMessagesList: {
            url: '/messages/:search',
            templateUrl: 'views/moderator-messages-list.html',
            controller: 'ModeratorMessagesListCtrl'
        },
        authenticatedMasterModeratorUploads: { // ****************************  Uploads **************************
            abstract: true,
            templateUrl: 'views/moderator-uploads.html',
            controller: 'ModeratorUploadsCtrl',
            resolve: {
                assignments: function(AdminService, $q, user, NotificationService, _) {
                    if (!user.permissions || !user.permissions.assignments) {
                        NotificationService.error('No assignments assigned.');
                        $state.go('authenticated.master.moderator.dashboard');
                        return false;
                    } else {
                        var deferred = $q.defer();

                        AdminService.getAllAssignments().$loaded().then(function(assignments) {
                            var keys = Object.keys(user.permissions.assignments),
                                i = keys.length,
                                allowed = [];

                            while (i--) {
                                if (user.permissions.assignments[keys[i]]) {
                                    allowed.push(keys[i]);
                                }
                            }

                            deferred.resolve(_.filter(assignments, function(assignment) {
                                return ~allowed.indexOf(assignment.$id);
                            }));
                        });

                        return deferred.promise;
                    }
                }
            }
        },
        authenticatedMasterModeratorUploadsList: {
            url: '/uploads/:search',
            templateUrl: 'views/moderator-uploads-list.html',
            controller: 'ModeratorUploadsListCtrl'
        }
    };

    var getState = function(obj) {
        return _.clone(obj);
    };

    $stateProvider
        .state('master', getState(states.master)) // Non-auth
        .state('master.nav', getState(states.masterNav))
        .state('master.nav.login', getState(states.masterNavLogin))
        .state('master.nav.register', getState(states.masterNavRegister))
        .state('master.nav.reset', getState(states.masterNavReset))
        .state('master.nav.cart', getState(states.masterNavCart))
        .state('authenticated', getState(states.authenticated)) // Authenticated
        .state('authenticated.master', getState(states.authenticatedMaster))
        .state('authenticated.master.nav', getState(states.authenticatedMasterNav))
        .state('authenticated.master.nav.dashboard', getState(states.authenticatedMasterNavDashboard))
        .state('authenticated.master.nav.account', getState(states.authenticatedMasterNavAccount))
        .state('authenticated.master.nav.checkout', getState(states.authenticatedMasterNavCheckout))
        .state('authenticated.master.nav.transaction', getState(states.authenticatedMasterNavTransaction))
        .state('authenticated.master.nav.messages', getState(states.authenticatedMasterNavMessages))
        .state('authenticated.master.nav.messages.list', getState(states.authenticatedMasterNavMessagesList))
        .state('authenticated.master.subscription', getState(states.authenticatedMasterSubscription))
        .state('authenticated.master.subscription.page', getState(states.authenticatedMasterSubscriptionPage))
        .state('authenticated.master.subscription.assignment', getState(states.authenticatedMasterSubscriptionAssignment))
        .state('authenticated.master.nav.find-assignment', getState(states.authenticatedMasterFindassignment))
        .state('authenticated.master.nav.archivedGallery', getState(states.authenticatedMasterArchivedGallery))
        .state('authenticated.master.admin', getState(states.authenticatedMasterAdmin)) // Admin
        .state('authenticated.master.admin.dashboard', getState(states.authenticatedMasterAdminDashboard))
        .state('authenticated.master.admin.words', getState(states.authenticatedMasterAdminWords))
        .state('authenticated.master.admin.words.list', getState(states.authenticatedMasterAdminWordsList))
        .state('authenticated.master.admin.word', getState(states.authenticatedMasterAdminWord))
        .state('authenticated.master.admin.assignments', getState(states.authenticatedMasterAdminAssignments))
        .state('authenticated.master.admin.assignments.list', getState(states.authenticatedMasterAdminAssignmentsList))
        .state('authenticated.master.admin.assignment', getState(states.authenticatedMasterAdminAssignment))
        .state('authenticated.master.admin.files', getState(states.authenticatedMasterAdminFiles))
        .state('authenticated.master.admin.files.list', getState(states.authenticatedMasterAdminFilesList))
        .state('authenticated.master.admin.product', getState(states.authenticatedMasterAdminProduct))
        .state('authenticated.master.admin.products', getState(states.authenticatedMasterAdminProducts))
        .state('authenticated.master.admin.users', getState(states.authenticatedMasterAdminUsers))
        .state('authenticated.master.admin.users.list', getState(states.authenticatedMasterAdminUsersList))
        .state('authenticated.master.admin.user', getState(states.authenticatedMasterAdminUser))
        .state('authenticated.master.admin.settings', getState(states.authenticatedMasterAdminSettings))
        .state('authenticated.master.admin.commerce', getState(states.authenticatedMasterAdminCommerce))
        .state('authenticated.master.admin.surveys', getState(states.authenticatedMasterAdminSurveys))
        .state('authenticated.master.admin.surveys.list', getState(states.authenticatedMasterAdminSurveysList))
        .state('authenticated.master.admin.survey', getState(states.authenticatedMasterAdminSurvey))
        .state('authenticated.master.admin.discounts', getState(states.authenticatedMasterAdminDiscounts))
        .state('authenticated.master.admin.discounts.list', getState(states.authenticatedMasterAdminDiscountsList))
        .state('authenticated.master.admin.social', getState(states.authenticatedMasterAdminSocial))
        .state('authenticated.master.admin.hashtags', getState(states.authenticatedMasterAdminHashtags))
        .state('authenticated.master.admin.transactions', getState(states.authenticatedMasterAdminTransactions))
        .state('authenticated.master.admin.transactions.list', getState(states.authenticatedMasterAdminTransactionsList))
        .state('authenticated.master.admin.transaction', getState(states.authenticatedMasterAdminTransaction))
        .state('authenticated.master.admin.subscriptions', getState(states.authenticatedMasterAdminSubscriptions))
        .state('authenticated.master.admin.subscriptions.list', getState(states.authenticatedMasterAdminSubscriptionsList))
        .state('authenticated.master.admin.subscription', getState(states.authenticatedMasterAdminSubscription))
        .state('authenticated.master.admin.shipments', getState(states.authenticatedMasterAdminShipments))
        .state('authenticated.master.admin.shipments.list', getState(states.authenticatedMasterAdminShipmentsList))
        .state('authenticated.master.admin.resources', getState(states.authenticatedMasterAdminResources))
        .state('authenticated.master.admin.resources.list', getState(states.authenticatedMasterAdminResourcesList))
        .state('authenticated.master.admin.messages', getState(states.authenticatedMasterAdminMessages))
        .state('authenticated.master.admin.messages.list', getState(states.authenticatedMasterAdminMessagesList))
        .state('authenticated.master.admin.uploads', getState(states.authenticatedMasterAdminUploads))
        .state('authenticated.master.admin.uploads.list', getState(states.authenticatedMasterAdminUploadsList))
        .state('authenticated.master.admin.feedback', getState(states.authenticatedMasterAdminFeedback))
        .state('authenticated.master.admin.email', getState(states.authenticatedMasterAdminEmail))
        .state('authenticated.master.admin.email.list', getState(states.authenticatedMasterAdminEmailList))
        .state('authenticated.master.admin.landing-pages', getState(states.authenticatedMasterAdminLandingPages))
        .state('authenticated.master.admin.landing-page', getState(states.authenticatedMasterAdminLandingPage))
        .state('authenticated.master.admin.logs', getState(states.authenticatedMasterAdminLogs))
        .state('authenticated.master.admin.logs.type', getState(states.authenticatedMasterAdminLogsType))
        .state('authenticated.master.admin.test', getState(states.authenticatedMasterAdminTest))
        .state('authenticated.master.moderator', getState(states.authenticatedMasterModerator)) // Moderator
        .state('authenticated.master.moderator.dashboard', getState(states.authenticatedMasterModeratorDashboard))
        .state('authenticated.master.moderator.messages', getState(states.authenticatedMasterModeratorMessages))
        .state('authenticated.master.moderator.messages.list', getState(states.authenticatedMasterModeratorMessagesList))
        .state('authenticated.master.moderator.uploads', getState(states.authenticatedMasterModeratorUploads))
        .state('authenticated.master.moderator.uploads.list', getState(states.authenticatedMasterModeratorUploadsList))
        .state('authenticated.master.moderator.feedback', getState(states.authenticatedMasterAdminFeedback))
        .state('authenticated.master.moderator.words', _.clone(states.authenticatedMasterAdminWords))
        .state('authenticated.master.moderator.words.list', _.clone(states.authenticatedMasterAdminWordsList))
        .state('authenticated.master.moderator.word', getState(states.authenticatedMasterAdminWord))
        .state('authenticated.master.moderator.assignments', getState(states.authenticatedMasterAdminAssignments))
        .state('authenticated.master.moderator.assignments.list', getState(states.authenticatedMasterAdminAssignmentsList))
        .state('authenticated.master.moderator.assignment', getState(states.authenticatedMasterAdminAssignment))
        .state('authenticated.master.moderator.files', getState(states.authenticatedMasterAdminFiles))
        .state('authenticated.master.moderator.files.list', getState(states.authenticatedMasterAdminFilesList))
        .state('authenticated.master.moderator.transactions', getState(states.authenticatedMasterAdminTransactions))
        .state('authenticated.master.moderator.transactions.list', getState(states.authenticatedMasterAdminTransactionsList))
        .state('authenticated.master.moderator.transaction', getState(states.authenticatedMasterAdminTransaction))
        .state('authenticated.master.moderator.discounts', getState(states.authenticatedMasterAdminDiscounts))
        .state('authenticated.master.moderator.discounts.list', getState(states.authenticatedMasterAdminDiscountsList))
        .state('authenticated.master.moderator.subscriptions', getState(states.authenticatedMasterAdminSubscriptions))
        .state('authenticated.master.moderator.subscriptions.list', getState(states.authenticatedMasterAdminSubscriptionsList))
        .state('authenticated.master.moderator.subscription', getState(states.authenticatedMasterAdminSubscription))
        .state('authenticated.master.moderator.shipments', getState(states.authenticatedMasterAdminShipments))
        .state('authenticated.master.moderator.shipments.list', getState(states.authenticatedMasterAdminShipmentsList))
        .state('authenticated.master.moderator.resources', getState(states.authenticatedMasterAdminResources))
        .state('authenticated.master.moderator.resources.list', getState(states.authenticatedMasterAdminResourcesList))
        .state('authenticated.master.moderator.email', getState(states.authenticatedMasterAdminEmail))
        .state('authenticated.master.moderator.email.list', getState(states.authenticatedMasterAdminEmailList))
        .state('authenticated.master.moderator.users', getState(states.authenticatedMasterAdminUsers))
        .state('authenticated.master.moderator.users.list', getState(states.authenticatedMasterAdminUsersList));


});