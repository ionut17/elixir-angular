var app = angular.module('app', ['ui.router', 'ngResource']);

app.config(function($urlRouterProvider, $locationProvider) {

    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/');

});

app.run(function($rootScope, $timeout) {

});

app.factory("Students", ["config", "$resource", function(config, $resource) {
    return $resource(config.apiEndpoint + "students", {}, {
        getAll: {
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        }
    });
}]);

app.factory("Users", ["config", "$resource", function(config, $resource) {
    return $resource(config.apiEndpoint + "users", {}, {
        getAll: {
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        }
    });
}]);

app.value("config", {
    apiEndpoint: "http://localhost:8080/api/",
})

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

app.config(function($stateProvider) {
    $stateProvider.state('courses', {
        url: '/courses',
        templateUrl: 'templates/courses.html',
        controller: 'CoursesController'
    });
});

app.controller('CoursesController', ['$scope', function($scope) {
    $scope.title = 'Courses';
}]);

app.config(function($stateProvider) {
    $stateProvider.state('dashboard', {
        url: '/dashboard',
        templateUrl: 'templates/dashboard.html',
        controller: 'DashboardController'
    });
});

app.controller('DashboardController', ['$scope', function($scope) {
    $scope.title = 'Dashboard';
}]);

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

app.config(function($stateProvider) {
    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'LoginController'
    });
});

app.controller('LoginController', ['$scope', function($scope) {
    $scope.title = 'Login';
}]);

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

app.directive('preloader', function() {
  return {
    restrict: 'E',
    replace: true,
    template: '<section class="preloader"><section class="p-boxes-wrapper"><figure class="p-box"></figure><figure class="p-box"></figure><figure class="p-box"></figure></section><section class="logo-wrapper hide"><figure class="logo"></figure></section></section>',
  };
});
