angular.module('easyFin4uApp')

	// inject the Todo service factory into our controller
	.controller('loginController', ['$rootScope','$scope','$http','$location' ,'loginServices',
		function($rootScope, $scope, $http,$location, loginServices) {
			$scope.formData = {};
			$scope.messagePresent = false;
			$scope.loading = true;

			$scope.login = function() {
				//console.log($scope.formData);
				//$scope.formData = loginServices.login($scope.formData);
				$http.post('/login', $scope.formData)
				.success(function(response){
					// No error: authentication OK
					$rootScope.user = response.user;
					$scope.messagePresent = true;
					$scope.message = response.message;
					$location.url('/fdDetails');
				})
				.error(function(response){
					// Error: authentication failed
					$scope.messagePresent = true;
					$scope.message = 'Authentication failed!';
					$location.url('/login');
				});
			};

	}]);
