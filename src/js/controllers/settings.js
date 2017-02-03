app.config(function($stateProvider) {
    $stateProvider.state('settings', {
        url: '/settings',
        templateUrl: 'templates/settings.html',
        controller: 'SettingsController'
    });
});

app.controller('SettingsController', ['$scope', '$rootScope', function($scope, $rootScope) {
    //Init
    $scope.title = 'Settings';

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Settings',
      'icon': null,
      'state': 'settings',
      'params': null
    };
    $rootScope.paths.length = 2;
}]);
