angular.module('easyFin4uApp')

	// inject the Todo service factory into our controller
	.controller('mainController', ['$scope','$rootScope','$http', function($scope,$rootScope, $http) {
		$scope.formData = {};
		$scope.loading = true;

		$rootScope.logout = function(){
			 $rootScope.user = undefined;
			 $rootScope.message = 'Logged out.';
			 $http.get('/logout');
		 };

		 angular.element(document).ready(function () {

					$('#myCarousel').carousel({
			        interval: 5000
			    });

			    $('#myCarousel').carousel('cycle');

				});


	}]);
