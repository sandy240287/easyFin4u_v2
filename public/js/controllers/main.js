angular.module('easyFin4uApp')

	// inject the Todo service factory into our controller
	.controller('mainController', ['$scope','$http', function($scope, $http) {
		$scope.formData = {};
		$scope.loading = true;
	}]);
