app.config(function($stateProvider) {
    $stateProvider.state('dashboard', {
        url: '/dashboard',
        templateUrl: 'templates/dashboard.html',
        controller: 'DashboardController'
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
