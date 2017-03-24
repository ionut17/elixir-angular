app.config(function($stateProvider) {
    $stateProvider.state('base.groups', {
      template: '<div ui-view></div>'
    });
});

// Group list
app.config(function($stateProvider, config) {
    $stateProvider.state('base.groups.list', {
        name: 'base.groups.list',
        url: '/groups?page&search',
        templateUrl: 'templates/groups-list.html',
        controller: 'GroupsListController',
        data: {
          authorizedRoles: config.authorizedRoles.groups.list
        },
        resolve: {
            resolvedData: ["Groups", "$http", "config", "$rootScope", "$q", "$stateParams", function(Groups, $http, config, $rootScope, $q, $stateParams) {
              search = $stateParams.search ? $stateParams.search : null;
              page = $stateParams.page ? parseInt($stateParams.page) : 0;
              return Groups.getAll({'page':page, 'search':search}).$promise.then(function(response){
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

app.controller('GroupsListController', ['$scope', '$rootScope', 'resolvedData', '$state', 'Groups', '$stateParams', function($scope, $rootScope, resolvedData, $state, Groups, $stateParams) {
    //Init
    $scope.title = 'Groups';
    $scope.groups = resolvedData.groups;
    $scope.pager = resolvedData.pager;

    console.log($scope.groups);

    $scope.pager.getPage = function(index){
      $stateParams.page = index;
      $state.go('base.groups.list', $stateParams, {reload: true});
    };

    // Search
    $scope.search = $rootScope.search;
    $scope.search.go = function(){
      $stateParams.page = 0;
      $stateParams.search = $scope.search.value;
      $state.go('base.groups.list', $stateParams, {reload: true});
    }
    document.getElementById("search-bar-input").addEventListener("keydown", function (e) {
      if (e.keyCode === 13) {
        $rootScope.search.go();
      }
    });

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
