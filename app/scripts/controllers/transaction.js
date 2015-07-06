'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:TransactionCtrl
 * @description
 * # TransactionCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('TransactionCtrl', function ($scope, transaction, userTransaction, AdminService, NotificationService) {
  	
    /*
     * Transaction
     */
  	transaction.$bindTo($scope, 'transaction');

  	$scope.sendEmail = function (key, transaction) {
  		AdminService.sendTransactionEmail(key, transaction).then(function () {
  			NotificationService.success('Email sent');
  		}, function (err) {
  			NotificationService.error('Email failed', err.statusText);
  		});
  	};

  	$scope.chargeCard = function (transaction, key) {
  		AdminService.chargeCard(transaction, key || transaction.$id).then(function () {
  			NotificationService.success('Card charged');
  		}, function (err) {
  			NotificationService.error('Charge failed', err.statusText);
  		});
  	};
    
  });
