app.config(function($stateProvider) {
    $stateProvider.state('users', {
        url: '/users',
        templateUrl: 'templates/users.html',
        controller: 'UsersController',
        resolve: {
            resolvedData: ["Users", "$http", "config", function(Users, $http, config) {
              return Users.getAll().$promise.then(function(response){
                //Insert appropiate tag
                angular.forEach(response, function(value, key) {
                  response[key].tag = "tag-"+value.type;
                });
                //Return modified response
                return {
                  users: response
                };
              });
            }]
        }
    });
});

app.controller('UsersController', ['$scope', 'config', 'resolvedData', 'Users', function($scope, config, resolvedData, Users) {
    $scope.title = 'Users';

    $scope.users = resolvedData.users;

    console.log($scope.users);

}]);
