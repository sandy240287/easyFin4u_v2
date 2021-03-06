angular.module('easyFin4uApp')

	// inject the Todo service factory into our controller
	.controller('profileController', ['$rootScope','$scope','$http','$location',
		function($rootScope, $scope, $http,$location, loginServices) {
			$scope.user =  $rootScope.user;

			if($rootScope.user){
        if(($rootScope.user.local.userVerifyToken !== "") && ($rootScope.user.local.userVerifyToken !== undefined)){
          $location.url('/login');
        }
      }

			$rootScope.logout = function(){
				//console.log("Logout");
				//$rootScope = undefined;
				 $rootScope.user = undefined;
				 $rootScope.message = 'Logged out.';
				 $http.get('/logout');
			 };

			 window.onbeforeunload = function() {
	       return "You will be logged out on refresh and would need to re-login."
	     }
	}]);
