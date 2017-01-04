var app = angular.module('app', ['ui.router', 'ngResource']);

app.config(function($urlRouterProvider, $locationProvider) {

    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/dashboard');

});

app.run(function($rootScope, $timeout, $state) {
  $rootScope.$state = $state;
});
