angular.module('easyFin4uApp')

	// inject the Todo service factory into our controller
	.controller('profileController', ['$rootScope','$scope','$http','$location',
		function($rootScope, $scope, $http,$location, loginServices) {
			$scope.user =  $rootScope.user;

			$rootScope.logout = function(){
				console.log("Logout");
				 $rootScope.user = undefined;
				 $rootScope.message = 'Logged out.';
				 $http.get('/logout');
			 };
	}]);
