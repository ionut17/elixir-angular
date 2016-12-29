app.config(function($stateProvider) {
    $stateProvider.state('settings', {
        url: '/settings',
        templateUrl: 'templates/settings.html',
        controller: 'SettingsController'
    });
});

app.controller('SettingsController', ['$scope', function($scope) {
    $scope.title = 'Settings';
}]);
