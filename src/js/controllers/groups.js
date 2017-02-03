app.config(function($stateProvider) {
    $stateProvider.state('groups', {
      template: '<div ui-view></div>'
    });
});

// Group list
app.config(function($stateProvider) {
    $stateProvider.state('groups.list', {
        name: 'groups.list',
        url: '/groups',
        templateUrl: 'templates/groups-list.html',
        controller: 'GroupsListController',
        resolve: {
            resolvedData: ["Groups", "$http", "config", function(Groups, $http, config) {
              return Groups.getAll().$promise.then(function(response){
                return {
                  groups: response
                };
              });
            }]
        }
    });
});

app.controller('GroupsListController', ['$scope', '$rootScope', 'resolvedData', '$state', function($scope, $rootScope, resolvedData, $state) {
    //Init
    $scope.title = 'Groups';
    $scope.groups = resolvedData.groups;

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Groups',
      'icon': null,
      'state': 'groups.list',
      'params': null
    };
    $rootScope.paths.length = 2;
}]);

//Group view
app.config(function($stateProvider) {
    $stateProvider.state('groups.view', {
        name: 'groups.view',
        url: '/groups/:id',
        templateUrl: 'templates/groups-view.html',
        controller: 'GroupsViewController',
        resolve: {
            resolvedData: ["Groups", "$stateParams", function(Groups, $stateParams) {
              return Groups.getById({
                id: $stateParams.id
              }).$promise.then(function(response){
                return {
                  group: response
                };
              }, function(response){
                console.log(response);
              });
            }]
        }
    });
});

app.controller('GroupsViewController', ['$scope', '$rootScope', 'resolvedData', function($scope, $rootScope, resolvedData) {
    //Init
    $scope.group = resolvedData.group;
    $scope.title = $scope.group.name + " ("+$scope.group.students.length+")";

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Groups',
      'icon': null,
      'state': 'groups.list',
      'params': null
    };
    $rootScope.paths[2] = {
      'title': $scope.group.name,
      'icon': null,
      'state': 'groups.view',
      'params': {
        id: $scope.group.id
      }
    };
    $rootScope.paths.length = 3;
}]);
