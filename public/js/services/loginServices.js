angular.module('easyFin4uApp')

	// super simple service
	// each function returns a promise object
	.factory('loginServices', ['$http',function($http) {
		return {
			// get : function() {
			// 	return $http.get('/api/todos');
			// },

			// login : function(loginData) {
			// 	return $http.post('/login', loginData);
			// }

			// Register the login() function
			  	login : function(loginData){
			    $http.post('/login', loginData)
			    .success(function(user){
			      // No error: authentication OK
			      $scope.message = 'Authentication successful!';
			      $location.url('/fdDetails');
			    })
			    .error(function(){
			      // Error: authentication failed
			      $scope.message = 'Authentication failed.';
			      $location.url('/login');
			    });
			  }

		}
	}]);
