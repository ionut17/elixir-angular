app.config(function($stateProvider) {
    $stateProvider.state('activities', {
        url: '/activities',
        templateUrl: 'templates/activities.html',
        controller: 'ActivitiesController'
    });
});

app.controller('ActivitiesController', ['$scope', function($scope) {
    $scope.title = 'Activities';
}]);
