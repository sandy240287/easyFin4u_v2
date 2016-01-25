angular.module('easyFin4uApp')

	// inject the Todo service factory into our controller
	.controller('forgotController', ['$rootScope','$scope','$http','$location' ,
		function($rootScope, $scope, $http,$location) {

			$scope.forgotPassword = function() {
				//$scope.formData = loginServices.login($scope.formData);
				$http.post('/forgot', $scope.formdata)
				.success(function(response){
					$scope.messagePresent = true;
					$scope.message = response;
					//$scope.messageRedirect = "Redirecting to Login in 5 Seconds...";

				})
				.error(function(response){
					$scope.messagePresent = true;
					$scope.message = 'Authentication failed!';
					$location.url('/');
				});
			};

	}]);
