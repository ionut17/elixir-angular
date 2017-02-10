app.config(function($stateProvider) {
    $stateProvider.state('base.groups', {
      template: '<div ui-view></div>'
    });
});

// Group list
app.config(function($stateProvider, config) {
    $stateProvider.state('base.groups.list', {
        name: 'base.groups.list',
        url: '/groups',
        templateUrl: 'templates/groups-list.html',
        controller: 'GroupsListController',
        data: {
          authorizedRoles: config.authorizedRoles.groups.list
        },
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
      'state': 'base.groups.list',
      'params': null
    };
    $rootScope.paths.length = 2;
}]);

//Group view
app.config(function($stateProvider, config) {
    $stateProvider.state('base.groups.view', {
        name: 'base.groups.view',
        url: '/groups/:id',
        templateUrl: 'templates/groups-view.html',
        controller: 'GroupsViewController',
        data: {
          authorizedRoles: config.authorizedRoles.groups.view
        },
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
      'state': 'base.groups.list',
      'params': null
    };
    $rootScope.paths[2] = {
      'title': $scope.group.name,
      'icon': null,
      'state': 'base.groups.view',
      'params': {
        id: $scope.group.id
      }
    };
    $rootScope.paths.length = 3;
}]);
