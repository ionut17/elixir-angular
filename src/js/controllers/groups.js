app.config(function($stateProvider) {
    $stateProvider.state('groups', {
        url: '/groups',
        templateUrl: 'templates/groups.html',
        controller: 'GroupsController'
    });
});

app.controller('GroupsController', ['$scope', function($scope) {
    $scope.title = 'Groups';
}]);
