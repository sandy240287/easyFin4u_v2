angular.module('easyFin4uApp')

	// inject the Todo service factory into our controller
	.controller('signupController', ['$rootScope','$scope','$http','$location',
		function($rootScope, $scope, $http,$location) {
			$rootScope.dangerMessagePresent = false;
			$rootScope.messagePresent = false;
			$rootScope.successMessagePresent = false;

			$scope.signup = function() {
				//console.log($scope.formData);
				//$scope.formData = loginServices.login($scope.formData);

				if($scope.formData.password !== $scope.formData.repassword){
					$rootScope.dangerMessagePresent = true;
					$rootScope.message = 'Passwords do not match. Please re-check the password.';
				}else{
							$http.post('/signup', $scope.formData)
							.success(function(user){
								// No error: authentication OK
								//console.log('Signup successful!');
								//console.log(user);
								$rootScope.user = undefined;
								$rootScope.successMessagePresent = true;
								$rootScope.message = 'Signup successful! Verification Mail has been sent to registered email ID.Please verify using the link in the mail and login using the credentials.Please allow a few minutes for the e-mail to arrive. If you do not receive the e-mail, please check your spam folder.';
								//$location.url('/login');
							})
							.error(function(err){
								// Error: authentication failed
								console.log('Signup failed!');
								$rootScope.dangerMessagePresent = true;
								$rootScope.message = 'Signup failed. Email ID already present in system. Please click on Forgot Password to reset password.';
								$location.url('/signup');
							});
					}
				};

	}]);
