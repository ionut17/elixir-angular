var app = angular.module('app', ['ui.router', 'ngResource']);

app.config(function($urlRouterProvider, $locationProvider) {

    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/dashboard');

});

app.run(function($rootScope, $timeout, $state) {
  $rootScope.$state = $state;
});

app.factory("Admins", ["config", "$resource", function(config, $resource) {
    return $resource(config.apiEndpoint + "admins", {}, {
        getAll: {
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "admins/:id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        },
        add: {
            url: config.apiEndpoint + "admins",
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        }
    });
}]);

app.factory("Groups", ["config", "$resource", function(config, $resource) {
    return $resource(config.apiEndpoint + "groups", {}, {
        getAll: {
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "groups/:id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        }
    });
}]);

app.factory("Lecturers", ["config", "$resource", function(config, $resource) {
    return $resource(config.apiEndpoint + "lecturers", {}, {
        getAll: {
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "lecturers/:id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        },
        add: {
            url: config.apiEndpoint + "lecturers",
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        }
    });
}]);

app.factory("Students", ["config", "$resource", function(config, $resource) {
    return $resource(config.apiEndpoint + "students", {}, {
        getAll: {
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "students/:id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        },
        add: {
            url: config.apiEndpoint + "students",
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        },
        addGroup: {
            url: config.apiEndpoint + "students/:id/groups",
            method: "POST",
            headers: {
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

app.controller('GroupsListController', ['$scope', 'resolvedData', '$state', function($scope, resolvedData, $state) {
    $scope.title = 'Groups';

    $scope.groups = resolvedData.groups;
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

app.controller('GroupsViewController', ['$scope', 'resolvedData', function($scope, resolvedData) {
    $scope.group = resolvedData.group;
    $scope.title = "Group "+ $scope.group.name + " ("+$scope.group.students.length+")";

    console.log($scope.group);
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
      template: '<div ui-view></div>'
    });
});

// Users List
app.config(function($stateProvider) {
    $stateProvider.state('users.list', {
        url: '/users',
        templateUrl: 'templates/users-list.html',
        controller: 'UsersListController',
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

app.controller('UsersListController', ['$scope', 'config', 'resolvedData', 'Users', 'Students', function($scope, config, resolvedData, Users, Students) {
    $scope.title = 'Users';
    $scope.users = resolvedData.users;

    $scope.modal = {
      user : {
        errors : {}
      }
    };
    $scope.modal.submit = function(){
      switch($scope.modal.user.type){
        case 'student':
          Students.add($scope.modal.user).$promise.then(function(response){
            console.log(response);
          }, function(response){
            console.log(response);
          });
          break;
        case 'lecturer':
          Lecturers.add($scope.modal.user).$promise.then(function(response){
            console.log(response);
          }, function(response){
            console.log(response);
          });
          break;
        case 'admin':
          Admins.add($scope.modal.user).$promise.then(function(response){
            console.log(response);
          }, function(response){
            console.log(response);
          });
          break;
      }
      console.log($scope.modal.user);
    }

    $scope.filters = {
      toggleFilters : undefined,
      isTypeShown : undefined,
      students : {
        visibility: true
      },
      lecturers : {
        visibility: true
      },
      admins : {
        visibility: true
      }
    }
    $scope.filters.toggleFilters = function(){
      console.log($scope.filters);
    }
    $scope.filters.isTypeShown = function(type){
      switch(type){
        case 'student':
          return $scope.filters.students.visibility;
        case 'lecturer':
          return $scope.filters.lecturers.visibility;
        case 'admin':
          return $scope.filters.admins.visibility;
      }
    }

}]);

//Users view
app.config(function($stateProvider) {
    $stateProvider.state('users.view', {
        url: '/users/:type/:id',
        templateUrl: 'templates/users-view.html',
        controller: 'UsersViewController',
        resolve: {
            resolvedData: ["Students", "Lecturers", "Admins", "$stateParams", function(Students, Lecturers, Admins, $stateParams) {
              var resource;
              switch($stateParams.type){
                case 'student':
                  resource = Students;
                  break;
                case 'lecturer':
                  resource = Lecturers;
                  break;
                case 'admin':
                  resource = Admins;
                  break;
              }
              return resource.getById({
                id: $stateParams.id
              }).$promise.then(function(response){
                response.hasGroups = $stateParams.type == 'student' ? true : false;
                return {
                  user: response
                };
              }, function(response){
                console.log(response);
              });
            }]
        }
    });
});

app.controller('UsersViewController', ['$scope', '$stateParams', 'Students', 'Groups', 'resolvedData', '$stateParams', function($scope, $stateParams, Students, Groups, resolvedData, $stateParams) {
    $scope.user = resolvedData.user;
    $scope.title = $scope.user.lastName + " " + $scope.user.firstName + " ("+$stateParams.type+")";

    $scope.modal = {
      element: $('#add-group-modal'),
      user: {},
      open: undefined,
      submit: undefined
    }

    $scope.modal.open = function(){
      // Get groups
      Groups.getAll().$promise.then(function(response){
        $scope.modal.groups = [];
        //Show only appropiate groups
        angular.forEach(response, function(group, key) {
          var hasGroup = false;
          angular.forEach(group.students, function(student, key){
            if ($scope.user.id === student.id){
              hasGroup = true;
            }
          });
          if (!hasGroup){
            $scope.modal.groups.push(group);
          }
        });
      }, function(response){
        console.log(response);
      });
    }

    $scope.modal.submit = function(){
      if ($stateParams.type === 'student'){
        Students.addGroup({
          id: $scope.user.id
        }, $scope.modal.user.group).$promise.then(function(response){
          console.log(response);
        }, function(response){
          console.log(response);
        });

      }
      $scope.modal.element.modal('hide');
    }

}]);

app.directive('preloader', function() {
  return {
    restrict: 'E',
    replace: true,
    template: '<section class="preloader"><section class="p-boxes-wrapper"><figure class="p-box"></figure><figure class="p-box"></figure><figure class="p-box"></figure></section><section class="logo-wrapper hide"><figure class="logo"></figure></section></section>',
  };
});
