var app = angular.module('app', ['ui.router', 'ngResource']);

app.config(function($urlRouterProvider, $locationProvider) {

    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/dashboard');

    //Extra functions
    String.prototype.capitalizeFirstLetter = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }

});

app.run(function($rootScope, $timeout, $state, config) {
  $rootScope.$state = $state;
  $rootScope.paths = [{
    'title': '',
    'icon': 'dashboard',
    'state': 'dashboard',
    'params': null
  }];
  $rootScope.getPath = function(state, paramObj){
    return $state.href(state, paramObj);
  }
  $rootScope.icons = {
    'type' : config.icons,
    'showAwesome' : config.icons == 'awesome',
    'showMaterial' : config.icons != 'awesome'
  }
});
