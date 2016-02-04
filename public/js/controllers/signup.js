angular.module('easyFin4uApp')

	// inject the Todo service factory into our controller
	.controller('signupController', ['$rootScope','$scope','$http','$location',
		function($rootScope, $scope, $http,$location) {
			$rootScope.dangerMessagePresent = false;
			$rootScope.messagePresent = false;
			$rootScope.successMessagePresent = false;

			$scope.signup = function() {
				console.log($scope.formData);
				//$scope.formData = loginServices.login($scope.formData);
				$http.post('/signup', $scope.formData)
				.success(function(user){
					// No error: authentication OK
					console.log('Signup successful!');
					console.log(user);
					$rootScope.user = undefined;
					$rootScope.messagePresent = true;
					$rootScope.successMessagePresent = 'Signup successful! Please login using the credentials.';
					$location.url('/login');
				})
				.error(function(err){
					// Error: authentication failed
					console.log('Signup failed!');
					$rootScope.dangerMessagePresent = true;
					$rootScope.message = 'Signup failed! Please retry.';
					$location.url('/signup');
				});
			};

	}]);
