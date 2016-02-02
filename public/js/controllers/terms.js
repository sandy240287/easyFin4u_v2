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
					$rootScope.user = response;
					$scope.messagePresent = false;
					$scope.message = 'Aceeptance Successful';
					$location.url('/fdDetails');
				})
				.error(function(response){
					// Error: authentication failed
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
					$rootScope.user = undefined;
					$scope.messagePresent = false;
					$scope.message = 'Rejection Successful';
					$location.url('/login');
				})
				.error(function(response){
					// Error: authentication failed
					$scope.messagePresent = true;
					$scope.message = 'Rejection failed!';
					$location.url('/login');
				});
			};


	}]);
