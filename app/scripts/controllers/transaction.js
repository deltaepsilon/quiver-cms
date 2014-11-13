'use strict';

/**
 * @ngdoc function
 * @name quiverCmsApp.controller:TransactionCtrl
 * @description
 * # TransactionCtrl
 * Controller of the quiverCmsApp
 */
angular.module('quiverCmsApp')
  .controller('TransactionCtrl', function ($scope, transactionRef, userTransactionRef, AdminService, NotificationService) {
  	var transaction = transactionRef.$asObject(),
  		userTransaction = userTransactionRef.$asObject();

  	transaction.$bindTo($scope, 'transaction');

  	$scope.sendEmail = function (key, transaction) {
  		AdminService.sendEmail(key, transaction).then(function () {
  			NotificationService.success('Email sent');
  		}, function (err) {
  			NotificationService.error('Email failed', err);
  		});
  	};

  	$scope.chargeCard = function (key, transaction) {
  		AdminService.chargeCard(key, transaction).then(function () {
  			NotificationService.success('Card charged');
  		}, function (err) {
  			NotificationService.error('Charge failed', err);
  		});
  	};
    
  });
