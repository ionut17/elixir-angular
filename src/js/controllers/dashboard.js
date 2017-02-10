app.config(function($stateProvider, config) {
    $stateProvider.state('base.dashboard', {
        url: '/dashboard',
        templateUrl: 'templates/dashboard.html',
        controller: 'DashboardController',
        data: {
          authorizedRoles: config.authorizedRoles.dashboard
        }
    });
});

app.controller('DashboardController', ['$scope','$rootScope', function($scope, $rootScope) {
    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Dashboard',
      'icon': null,
      'state': 'dashboard',
      'params': null
    };

    //Logic
    $scope.title = 'Dashboard';
}]);
