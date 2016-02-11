angular.module('easyFin4uApp')

	// inject the Todo service factory into our controller
	.controller('tncController', ['$rootScope','$scope','$http','$location',
		function($rootScope, $scope, $http,$location) {
			$scope.formData = {};
			$scope.messagePresent = false;
			$scope.loading = true;

			$scope.accept = function() {
				//console.log($scope.formData);
				//$scope.formData = loginServices.login($scope.formData);
				$http.post('/api/acceptTnc', {status:"true",user : $rootScope.user})
				.success(function(response){
					//console.log(JSON.stringify(response));
					$rootScope.tncStatus = true;
					$rootScope.user = response;
					$scope.messagePresent = false;
					$scope.message = 'Aceeptance Successful';
					$location.url('/portfolio');
				})
				.error(function(response){
					// Error: authentication failed
					$rootScope.tncStatus = false;
					$scope.messagePresent = true;
					$scope.message = 'Aceeptance failed!';
					$location.url('/login');
				});
			};

			$scope.reject = function() {
				//console.log($scope.formData);
				//$scope.formData = loginServices.login($scope.formData);
				$http.post('/api/acceptTnc', {status:"false",user : $rootScope.user})
				.success(function(response){
					$rootScope.tncStatus = false;
					$rootScope.user = undefined;
					$scope.messagePresent = false;
					$scope.message = 'Rejection Successful';
					$location.url('/login');
				})
				.error(function(response){
					// Error: authentication failed
					$rootScope.tncStatus = false;
					$scope.messagePresent = true;
					$scope.message = 'Rejection failed!';
					$location.url('/login');
				});
			};

			window.onbeforeunload = function() {
	      return "You will be logged out on refresh and would need to re-login."
	    }


	}]);
