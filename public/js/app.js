angular.module('easyFin4uApp', ['ngCookies', 'ngResource', 'ngMessages', 'ngRoute', 'mgcrea.ngStrap'])
  .config(['$locationProvider','$routeProvider', function($locationProvider,$routeProvider)
  {
    $locationProvider.html5Mode(true);
    $routeProvider
    .when('/', {
      templateUrl: 'views/main.html',
      controller: 'mainController'
    })
    .when('/login', {
      templateUrl: 'views/login.html',
      controller: 'loginController'
    })
    .when('/signup', {
      templateUrl: 'views/signup.html',
      controller: 'signupController'
    })
    .when('/fdDetails', {
      templateUrl: 'views/fdDetails.html',
      controller: 'fdController'
    })
    .when('/profile', {
      templateUrl: 'views/profile.html',
      controller: 'profileController'
    })
    .when('/forgot', {
      templateUrl: 'views/forgot.html',
      controller: 'forgotController'
    })
    .otherwise({
      redirectTo: '/'
    });

}]);
