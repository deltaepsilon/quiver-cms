'use strict';

/**
 * @ngdoc directive
 * @name quiverCmsApp.directive:map
 * @description
 * # map
 */
angular.module('quiverCmsApp')
  .directive('myMaps', function () {
    return {
      restrict: 'E',
			template: '<div></di>',
			replace: true,
			link: function(scope, element, attrs){
				var myLatLng = new google.maps.LatLng(30.524344,-86.451758);
				var mapOptions = {
					center: myLatLng,
					zoom: 10,
					mapTypeId: google.maps.MapTypeId.ROADMAP,
					disableDefaultUI: true
				};
				var map = new google.maps.Map(document.getElementById(attrs.id), mapOptions);
				var marker = new google.maps.Marker({
					position: myLatLng,
					map: map,
					title: "My location"
				});
				marker.setMap(map);
			}
    };
  });
