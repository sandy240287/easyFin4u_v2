angular.module('easyFin4uApp')

	// inject the Todo service factory into our controller
	.controller('mainController', ['$scope','$rootScope','$http', function($scope,$rootScope, $http) {
		$scope.formData = {};
		$scope.loading = true;

		$rootScope.logout = function(){
			 $rootScope.user = undefined;
			 $rootScope.message = 'Logged out.';
			 $http.get('/logout');
		 };

		$('.carousel').carousel({
        interval: 3000
    });

    $('.carousel').carousel('cycle');


	}]);
