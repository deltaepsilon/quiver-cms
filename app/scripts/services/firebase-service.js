'use strict';

/**
 * @ngdoc service
 * @name quiverCmsApp.firebaseService
 * @description
 * # firebaseService
 * Service in the quiverCmsApp.
 */
angular.module('quiverCmsApp')
    .service('FirebaseService', function($q, $timeout, $firebaseArray, moment, _) {
        var secureRefs = [],
            PaginatingArray = $firebaseArray.$extend({
                // $save: function (indexOrItem) {
                //   return $firebaseArray.prototype.$save.call(this, indexOrItem);
                // },
                // $add: function(item) {
                //     item.$priority = moment().unix();
                //     return $firebaseArray.prototype.$add.call(this, item);
                // },
                $get: function() {
                    if (this.$list.$ref() instanceof Firebase) {
                        this.$path = this.$list.$ref().toString();
                    } else if (this.$list.$ref().repo) {
                        this.$path = this.$list.$ref().repo.toString() + this.$list.$ref().path.toString();
                    } else if (this.$list.$ref().ref) {
                        this.$path = this.$list.$ref().ref().toString();
                    }

                    var self = this,
                        ref = firebase.database().ref(this.$path),
                        defaultQuery = this.$defaultQuery || this.$list.$defaultQuery;

                    // this.$list.$destroy();

                    if (this.$query.at.type !== 'equalTo') {
                        if (this.$query.limitTo === 'first') {
                            ref = ref.limitToFirst(this.$query.limit);
                        } else {
                            ref = ref.limitToLast(this.$query.limit);
                        }
                    }

                    if (this.$query.orderBy === 'priority') {
                        ref = ref.orderByPriority();
                    } else if (this.$query.orderBy === 'key') {
                        ref = ref.orderByKey();
                    } else {
                        ref = ref.orderByChild(this.$query.orderBy);
                    }

                    if (this.$query.at.value) {
                        if (this.$query.at.type === 'equalTo') {
                            ref = ref.equalTo(this.$query.at.value);
                        } else if (this.$query.at.type === 'startAt') {
                            ref = ref.startAt(this.$query.at.value);
                        } else if (this.$query.at.type === 'endAt') {
                            ref = ref.endAt(this.$query.at.value);
                        }
                    }

                    var paginatingArray = new PaginatingArray(ref);
                    paginatingArray.$query = this.$query;
                    paginatingArray.$defaultQuery = defaultQuery;

                    // paginatingArray.$loaded().then(this.$list.$destroy);

                    return paginatingArray;
                },
                $next: function() {
                    var self = this,
                        keys = _.pluck(this.$list, '$id'),
                        max = keys[keys.length - 1],
                        paginatingArray = this.$list.$orderByKey().$startAt(max).$get();

                    paginatingArray.$prevQuery = _.clone(this.$query);
                    paginatingArray.$query.page = Math.max(0, this.$list.$query.page -1);

                    paginatingArray.$loaded().then(function(newArray) {
                        if (newArray.length < paginatingArray.$query.limit) {
                            paginatingArray.$nextDisabled = true;
                        }
                    });

                    return paginatingArray;

                },
                $prev: function() {
                    var self = this,
                        keys = _.pluck(this.$list, '$id'),
                        min = keys[0],
                        // target = isFinite(min) ? min - 1 : this.$query.at.value,
                        paginatingArray = this.$list.$orderByKey().$endAt(min).$get();

                    paginatingArray.$prevQuery = _.clone(this.$query);
                    paginatingArray.$query.page = this.$list.$query.page + 1;

                    paginatingArray.$loaded().then(function(newArray) {
                        if (newArray.length < paginatingArray.$query.limit) {
                            paginatingArray.$prevDisabled = true;
                        }
                    });

                    return paginatingArray;
                },
                $more: function() {                   
                    this.$query = _.clone(this.$list.$defaultQuery);

                    var paginatingArray = this.$orderByKey().$limit(this.$list.$query.limit + 10).$get();

                    paginatingArray.$loaded().then(function(newArray) {
                        if (newArray.length < paginatingArray.$query.limit) {
                            paginatingArray.$moreDisabled = true;
                        }
                    });

                    return paginatingArray;
                },
                $reset: function() {
                    this.$query = _.clone(this.$list.$defaultQuery);
                    var paginatingArray = this.$list.$get();
                    paginatingArray.$resetDisabled = true;
                    return paginatingArray;
                },
                $query: {
                    limit: 10,
                    orderBy: 'key',
                    limitTo: 'first',
                    at: {
                        type: false,
                        value: false
                    },
                    page: 1
                },
                $default: function(query) {
                    if (query) {
                        this.$query = _.clone(query);
                    }
                    this.$defaultQuery = _.clone(this.$query);
                    return this.$list;
                },
                $limit: function(limit) {
                    if (!limit || typeof limit !== 'number' || limit < 0) {
                        this.$query.limit = 10;
                    } else {
                        this.$query.limit = limit;
                    }

                    return this.$list;
                },
                $orderByChild: function(name) {
                    this.$query.orderBy = name;
                    return this.$list;
                },
                $orderByKey: function() {
                    this.$query.orderBy = 'key';
                    return this.$list;
                },
                $orderByPriority: function() {
                    this.$query.orderBy = 'priority';
                    return this.$list;
                },
                $limitToFirst: function(limit) {
                    this.$limit(limit);
                    this.$query.limitTo = 'first';
                    return this.$list;
                },
                $limitToLast: function(limit) {
                    this.$limit(limit);
                    this.$query.limitTo = 'last';
                    return this.$list;
                },
                $startAt: function(value) {
                    if (value && (typeof value !== 'number' || isFinite(value))) {
                        this.$query.at = {
                            type: 'startAt',
                            value: value
                        };
                    } else {
                        this.$query.at = {
                            type: false,
                            value: false
                        };
                    }

                    return this.$list;
                },
                $endAt: function(value) {
                    if (value && (typeof value !== 'number' || isFinite(value))) {
                        this.$query.at = {
                            type: 'endAt',
                            value: value
                        };
                    } else {
                        this.$query.at = {
                            type: false,
                            value: false
                        };
                    }

                    return this.$list;
                },
                $equalTo: function(value) {
                    this.$query.at = {
                        type: 'equalTo',
                        value: value
                    };
                    return this.$list;
                }
            });

        return {
            query: function(ref, query) {
                if (!query) {
                    return ref;
                }

                // return ref.limitToFirst(query.limitToFirst);

                // Respect only one orderBy* option
                if (query.orderByChild) {
                    ref = ref.orderByChild(query.orderByChild);
                } else if (query.orderByKey) {
                    ref = ref.orderByKey();
                } else if (query.orderByPriority) {
                    ref = ref.orderByPriority();
                }

                // Respect only one limitTo* option
                if (query.limitToFirst) {
                    ref = ref.limitToFirst(query.limitToFirst);
                } else if (query.limitToLast) {
                    ref = ref.limitToLast(query.limitToLast);
                }

                // Respect equalTo or one or both *At query
                if (typeof query.equalTo !== 'undefined') {
                    ref = ref.equalTo(query.equalTo);
                } else {
                    if (typeof query.startAt !== 'undefined') {
                        ref = ref.startAt(query.startAt);
                    }
                    if (typeof query.endAt !== 'undefined') {
                        ref = ref.endAt(query.endAt);
                    }

                }

                return ref;

            },

            paginatingArray: function(ref) {
                var paginatingArray = new PaginatingArray(ref.orderByKey().limitToFirst(10));

                paginatingArray.$default({
                    limit: 10,
                    orderBy: 'key',
                    limitTo: 'first',
                    at: {
                        type: false,
                        value: false
                    },
                    page: 1
                });

                return paginatingArray;
            },

            registerSecureRef: function(ref) {
                secureRefs.push(ref);
                return ref;
            },

            destroySecureRefs: function() {
                var deferred = $q.defer(),
                    i = secureRefs.length;

                while (i--) {
                    if (typeof secureRefs[i].$destroy === 'function') {
                        secureRefs[i].$destroy();
                    }
                }

                secureRefs = [];

                $timeout(deferred.resolve);

                return deferred.promise;

            }

        };
    });