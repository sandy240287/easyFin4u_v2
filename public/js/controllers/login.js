angular.module('easyFin4uApp')

	// inject the Todo service factory into our controller
	.controller('loginController', ['$rootScope','$scope','$http','$location' ,'loginServices',
		function($rootScope, $scope, $http,$location, loginServices) {
			$scope.formData = {};
			$rootScope.dangerMessagePresent = false;
			$rootScope.messagePresent = false;
			$rootScope.successMessagePresent = false;

			$scope.login = function() {
				//console.log($scope.formData);
				//$scope.formData = loginServices.login($scope.formData);
				$http.post('/login', $scope.formData)
				.success(function(response){
					// No error: authentication OK
					$rootScope.user = response.user;
					$scope.messagePresent = false;
					$scope.message = 'Authentication Successful';

					$http.get('/api/acceptStatus', $rootScope.user).success(function(response){
						//console.log(JSON.stringify(response));
						//console.log(JSON.stringify(response.user.local.tncStatus));
						if(response.user.local.tncStatus == "false"){
							$location.url('/terms');
						}else{
							$rootScope.tncStatus = true;
							$rootScope.user = response.user;
							$rootScope.successMessagePresent = false;
							$scope.message = 'Login Successful';
							$location.url('/fdDetails');
						}
					}).error(function (response){
						$location.url('/login');
					});

				})
				.error(function(response){
					// Error: authentication failed
					$rootScope.dangerMessagePresent = true;
					$rootScope.message = 'Authentication failed!';
					$location.url('/login');
				});
			};

	}]);
