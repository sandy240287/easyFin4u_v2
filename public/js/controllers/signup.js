angular.module('easyFin4uApp')

	// inject the Todo service factory into our controller
	.controller('signupController', ['$rootScope','$scope','$http','$location',
		function($rootScope, $scope, $http,$location) {

			$scope.signup = function() {
				console.log($scope.formData);
				//$scope.formData = loginServices.login($scope.formData);
				$http.post('/signup', $scope.formData)
				.success(function(user){
					// No error: authentication OK
					console.log('Signup successful!');
					console.log(user);
					$rootScope.user = user;
					$scope.messagePresent = true;
					$scope.message = 'Signup successful!';
					$location.url('/login');
				})
				.error(function(err){
					// Error: authentication failed
					console.log('Signup failed!');
					$scope.messagePresent = true;
					$scope.message = 'Signup failed!';
					$location.url('/signup');
				});
			};

	}]);
