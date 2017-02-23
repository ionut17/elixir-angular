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
            resolvedData: ["Groups", "$http", "config", "$rootScope", "$q", function(Groups, $http, config, $rootScope, $q) {
              return Groups.getAll().$promise.then(function(response){
                response.pager.pages = new Array(response.pager.totalPages);
                return {
                  groups: response.content,
                  pager: response.pager
                };
              }, function(response){
                console.log(response);
                $rootScope.$broadcast("not-authorized");
                return $q.reject("Rejection message!");
              });
            }]
        }
    });
});

app.controller('GroupsListController', ['$scope', '$rootScope', 'resolvedData', '$state', 'Groups', function($scope, $rootScope, resolvedData, $state, Groups) {
    //Init
    $scope.title = 'Groups';
    $scope.groups = resolvedData.groups;
    $scope.pager = resolvedData.pager;

    console.log($scope.groups);

    $scope.refresh = function(index){
      if (!index){
        index = 0;
      }
      Groups.getAll({'page':index}).$promise.then(function(response){
        response.pager.pages = new Array(response.pager.totalPages);
        //return
        $scope.groups = response.content;
        $scope.pager = response.pager;
        $scope.pager.getPage = function(index){
          $scope.refresh(index);
        };
      });
    }

    //Get specific page
    $scope.pager.getPage = function(index){
      $scope.refresh(index);
    };

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
            resolvedData: ["Groups", "$stateParams", "$rootScope", "$q", function(Groups, $stateParams, $rootScope, $q) {
              return Groups.getById({
                id: $stateParams.id
              }).$promise.then(function(response){
                return {
                  group: response
                };
              }, function(response){
                console.log(response);
                $rootScope.$broadcast("not-authorized");
                return $q.reject("Rejection message!");
              });
            }]
        }
    });
});

app.controller('GroupsViewController', ['$scope', '$rootScope', 'resolvedData', function($scope, $rootScope, resolvedData) {
    //Init
    $scope.group = resolvedData.group;
    $scope.title = "Grupa "+$scope.group.name;

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
