var app = angular.module('app', ['ui.router', 'ngResource']);

app.config(function($urlRouterProvider, $locationProvider) {

    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/dashboard');

    //Extra functions
    String.prototype.capitalizeFirstLetter = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }

});

app.run(function($rootScope, $timeout, $state, config) {
  $rootScope.$state = $state;
  $rootScope.paths = [{
    'title': '',
    'icon': 'dashboard',
    'state': 'dashboard',
    'params': null
  }];
  $rootScope.getPath = function(state, paramObj){
    return $state.href(state, paramObj);
  }
  $rootScope.icons = {
    'type' : config.icons,
    'showAwesome' : config.icons == 'awesome',
    'showMaterial' : config.icons != 'awesome'
  }
});

app.factory("Activities", ["config", "$resource", function(config, $resource) {
    return $resource(config.apiEndpoint + "activities", {}, {
        getBasic: {
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        },
        getAll: {
            url: config.apiEndpoint + "activities/join",
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        }
    });
}]);

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

app.factory("Attendances", ["config", "$resource", function(config, $resource) {
    return $resource(config.apiEndpoint + "attendances", {}, {
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
            url: config.apiEndpoint + "attendances/:activity_id/:student_id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        },
        getByActivityId: {
            url: config.apiEndpoint + "attendances/:activity_id",
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        }
    });
}]);

app.factory("Courses", ["config", "$resource", function(config, $resource) {
    return $resource(config.apiEndpoint + "courses", {}, {
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
            url: config.apiEndpoint + "courses/:id",
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

app.factory("Files", ["config", "$resource", function(config, $resource) {
    return $resource(config.apiEndpoint + "files", {}, {
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
            url: config.apiEndpoint + "files/:activity_id/:student_id",
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        }
    });
}]);

app.factory("Grades", ["config", "$resource", function(config, $resource) {
    return $resource(config.apiEndpoint + "grades", {}, {
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
            url: config.apiEndpoint + "grades/:activity_id/:student_id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        },
        getByActivityId: {
            url: config.apiEndpoint + "grades/:activity_id",
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
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
    icons: "material" //'material' or 'awesome'
})

app.config(function($stateProvider) {
    $stateProvider.state('activities', {
      template: '<div ui-view></div>'
    });
});

// Actitivities list
app.config(function($stateProvider) {
    $stateProvider.state('activities.list', {
        name: 'activities.list',
        url: '/activities/:type',
        templateUrl: 'templates/activities-list.html',
        controller: 'ActivitiesListController',
        // params:  {
        //   type: {
        //     value: null,
        //     squash: true
        //   }
        // },
        resolve: {
            resolvedData: ["Activities", "Attendances", "Grades", "Files", "$http", "config", "$stateParams", function(Activities, Attendances, Grades, Files, $http, config, $stateParams) {
              var resource = null, role = null;
              switch($stateParams.type){
                case 'attendances':
                  resource = Attendances;
                  role = 'attendances';
                  break;
                case 'grades':
                  resource = Grades;
                  role = 'grades';
                  break;
                case 'files':
                  resource = Files;
                  role = 'files';
                  break;
                default:
                  resource = Activities;
                  role = 'activities';
                  break;
              }
              //In case of no parameters, return default view
              return resource.getAll().$promise.then(function(response){
                //Insert appropiate tag
                angular.forEach(response, function(value, key) {
                  response[key].tag = "tag-"+value.activity.type.name;
                  response[key].roleTag = "tag-"+value.role;
                  if (!value.role){
                    value.role = role.slice(0,-1);
                  }
                  if (value.student){
                    value.user = value.student;
                    delete value.student;
                  }
                });
                response.type = role;
                response.singleType = role == 'activities' ? false : true;
                //Return response
                return {
                  activities: response
                };
              }, function(response){
                console.log(response);
                return [];
              });
            }]
        }
    });
});

app.controller('ActivitiesListController', ['$scope', '$rootScope', 'resolvedData', '$state', "$stateParams", function($scope, $rootScope, resolvedData, $state, $stateParams) {
    //Init
    $scope.activities = resolvedData.activities;
    $scope.title = $scope.activities.type;

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Activities',
      'icon': null,
      'state': 'activities.list',
      'params': {
        'type': null
      }
    };
    $rootScope.paths.length = 2;
    if($stateParams.type){
      $rootScope.paths[2] = {
        'title': $stateParams.type,
        'icon': null,
        'state': 'activities.list',
        'params': {
          'type': $stateParams.type
        }
      };
      $rootScope.paths.length = 3;
    }

    //Logic
    console.log(resolvedData);
}]);

//Sub-Activities List
app.config(function($stateProvider) {
    $stateProvider.state('activities.sublist', {
        name: 'activities.sublist',
        url: '/activities/:type/:activity_id',
        templateUrl: 'templates/activities-sublist.html',
        controller: 'ActivitiesSubListController',
        resolve: {
            resolvedData: ["Attendances", "Grades", "Files", "$http", "config", "$stateParams", function(Attendances, Grades, Files, $http, config, $stateParams) {
              console.log($stateParams);
              var resource = null, role = null;
              switch($stateParams.type){
                case 'attendances':
                  resource = Attendances;
                  role = 'attendance';
                  break;
                case 'grades':
                  resource = Grades;
                  role = 'grade';
                  break;
                case 'files':
                  resource = Files;
                  role = 'file';
                  break;
              }
              return resource.getByActivityId({
                activity_id: $stateParams.activity_id,
              }).$promise.then(function(response){
                response.type = $stateParams.type;
                response.activityId = $stateParams.activity_id;
                response.typeAll = false;
                return {
                  activities: response
                };
              }, function(response){
                console.log(response);
              });
            }]
        }
    });
});

app.controller('ActivitiesSubListController', ['$scope', '$rootScope', 'resolvedData', '$state', "$stateParams", function($scope, $rootScope, resolvedData, $state, $stateParams) {
    //Init
    $scope.activities = resolvedData.activities;
    $scope.title = [$scope.activities.typeAll ? $scope.activities.type : $scope.activities[0].activity.name,"(",$scope.activities[0].activity.course.title,")"].join(" ");
    $scope.table = {
      showGrades : $scope.activities.type === 'grades'
    }

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Activities',
      'icon': null,
      'state': 'activities.list',
      'params': null
    };
    $rootScope.paths[2] = {
      'title': $scope.activities.type,
      'icon': null,
      'state': 'activities.list',
      'params': {
        type: $scope.activities.type
      }
    };
    $rootScope.paths.length = 3;
    if (!$scope.activities.typeAll){
      $rootScope.paths[3] = {
        'title': $scope.activities[0].activity.name + " ("+$scope.activities[0].activity.course.title+")",
        'icon': null,
        'state': 'activities.sublist',
        'params': {
          type: $scope.activities.type,
          activity_id: $scope.activities.activityId
        }
      };
      $rootScope.paths.length = 4;
    }

    //Logic
    console.log(resolvedData);
}]);

//Activity detail view
app.config(function($stateProvider) {
    $stateProvider.state('activities.view', {
        name: 'activities.view',
        url: '/activities/:type/:activity_id/:user_id',
        templateUrl: 'templates/activities-view.html',
        controller: 'ActivitiesViewController',
        resolve: {
            resolvedData: ["Attendances", "Grades", "Files", "$stateParams", function(Attendances, Grades, Files, $stateParams) {
              var resource;
              switch($stateParams.type){
                case 'attendances':
                  resource = Attendances;
                  break;
                case 'grades':
                  resource = Grades;
                  break;
                case 'files':
                  resource = Files;
                  break;
              }
              return resource.getById({
                student_id: $stateParams.user_id,
                activity_id: $stateParams.activity_id,
              }).$promise.then(function(response){
                response.type = $stateParams.type;
                response.user = response.student;
                response.user.type = 'student';
                response.user.tag = 'tag-'+response.user.type;
                delete response.student;
                return {
                  activity: response
                };
              }, function(response){
                console.log(response);
              });
            }]
        }
    });
});

app.controller('ActivitiesViewController', ['$scope', '$rootScope', 'resolvedData', function($scope, $rootScope, resolvedData) {
    //Init
    $scope.activity = resolvedData.activity;
    $scope.title = [$scope.activity.user.firstName,$scope.activity.user.lastName,'-',$scope.activity.type.slice(0,-1),'at',$scope.activity.activity.type.name,'(',$scope.activity.activity.course.title,')'].join(' ');

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Activities',
      'icon': null,
      'state': 'activities.list',
      'params': null
    };
    $rootScope.paths[2] = {
      'title': $scope.activity.type,
      'icon': null,
      'state': 'activities.list',
      'params': {
        type: $scope.activity.type
      }
    };
    $rootScope.paths[3] = {
      'title': $scope.activity.activity.name + " ("+$scope.activity.activity.course.title+")",
      'icon': null,
      'state': 'activities.sublist',
      'params': {
        type: $scope.activity.type,
        activity_id: $scope.activity.id.activityId
      }
    };
    $rootScope.paths[4] = {
      'title': $scope.activity.user.firstName +' '+ $scope.activity.user.lastName,
      'icon': null,
      'state': 'activities.view',
      'params': {
        type: $scope.activity.type,
        activity_id: $scope.activity.activity.id,
        user_id: $scope.activity.user.id
      }
    };
    $rootScope.paths.length = 5;

    //Logic
    console.log($scope.activity);
    $scope.table = {
      title : $scope.activity.type.slice(0,-1) + " Details",
      columns : {
        user: $scope.activity.user.type.capitalizeFirstLetter(),
        activity: 'Activity',
        course: 'Course'
      },
      extraRows : []
    }

    switch($scope.activity.type){
      case 'attendances':
        break;
      case 'grades':
        $scope.table.extraRows = [{
            title : 'Value',
            value : $scope.activity.value,
            customClass : 'tag tag-auto tag-grade'
          }
        ]
        break;
      case 'files':
        break;
    }
}]);

app.config(function($stateProvider) {
    $stateProvider.state('courses', {
      template: '<div ui-view></div>'
    });
});

// Group list
app.config(function($stateProvider) {
    $stateProvider.state('courses.list', {
        name: 'courses.list',
        url: '/courses',
        templateUrl: 'templates/courses-list.html',
        controller: 'CoursesListController',
        resolve: {
            resolvedData: ["Courses", "$http", "config", function(Courses, $http, config) {
              return Courses.getAll().$promise.then(function(response){
                return {
                  courses: response
                };
              });
            }]
        }
    });
});

app.controller('CoursesListController', ['$scope', '$rootScope', 'resolvedData', '$state', function($scope, $rootScope, resolvedData, $state) {
    //Init
    $scope.title = 'Courses';
    $scope.courses = resolvedData.courses;

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Courses',
      'icon': null,
      'state': 'courses.list',
      'params': null
    };
    $rootScope.paths.length = 2;
}]);

//Group view
app.config(function($stateProvider) {
    $stateProvider.state('courses.view', {
        name: 'courses.view',
        url: '/courses/:id',
        templateUrl: 'templates/courses-view.html',
        controller: 'CoursesViewController',
        resolve: {
            resolvedData: ["Courses", "$stateParams", function(Courses, $stateParams) {
              return Courses.getById({
                id: $stateParams.id
              }).$promise.then(function(response){
                return {
                  course: response
                };
              }, function(response){
                console.log(response);
              });
            }]
        }
    });
});

app.controller('CoursesViewController', ['$scope', '$rootScope', 'resolvedData', function($scope, $rootScope, resolvedData) {
    //Init
    $scope.course = resolvedData.course;
    $scope.title = $scope.course.title + " ("+$scope.course.lecturers.length+")";

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Courses',
      'icon': null,
      'state': 'courses.list',
      'params': null
    };
    $rootScope.paths[2] = {
      'title': $scope.course.title,
      'icon': null,
      'state': 'courses.view',
      'params': {
        id: $scope.course.id
      }
    };
    $rootScope.paths.length = 3;
}]);

app.config(function($stateProvider) {
    $stateProvider.state('dashboard', {
        url: '/dashboard',
        templateUrl: 'templates/dashboard.html',
        controller: 'DashboardController'
    });
});

app.controller('DashboardController', ['$scope','$rootScope', function($scope, $rootScope) {
    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Dashboard',
      'icon': null,
      'state': 'dashboard',
      'params': null
    };

    //Logic
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

app.controller('SettingsController', ['$scope', '$rootScope', function($scope, $rootScope) {
    //Init
    $scope.title = 'Settings';

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Settings',
      'icon': null,
      'state': 'settings',
      'params': null
    };
    $rootScope.paths.length = 2;
}]);

app.config(function($stateProvider) {
    $stateProvider.state('users', {
      template: '<div ui-view></div>'
    });
});

// Users List
app.config(function($stateProvider) {
    $stateProvider.state('users.list', {
        url: '/users/:type',
        templateUrl: 'templates/users-list.html',
        controller: 'UsersListController',
        params:  {
          type: {
            value: null,
            squash: true
          }
        },
        resolve: {
            resolvedData: ["Users", "Students", "Lecturers", "Admins", "$http", "config", "$stateParams", function(Users, Students, Lecturers, Admins, $http, config, $stateParams) {
              console.log($stateParams);
              var resource = null, role = true;
              switch($stateParams.type){
                case 'students':
                  resource = Students;
                  role = 'students';
                  break;
                case 'lecturers':
                  resource = Lecturers;
                  role = 'lecturers';
                  break;
                case 'admins':
                  resource = Admins;
                  role = 'admins';
                  break;
                default:
                  resource = Users;
                  role = 'users';
                  break;
              }
              return resource.getAll().$promise.then(function(response){
                //Insert appropiate tag
                angular.forEach(response, function(value, key) {
                  value.tag = "tag-"+value.type;
                  if (!value.type){
                    value.type = role.slice(0,-1);
                  }
                });
                response.type = role;
                response.singleType = role == 'users' ? false : true;
                //Return modified response
                return {
                  users: response
                };
              });
            }]
        }
    });
});

app.controller('UsersListController', ['$scope', '$rootScope', '$stateParams', 'config', 'resolvedData', 'Users', 'Students','Lecturers','Admins', function($scope, $rootScope, $stateParams, config, resolvedData, Users, Students, Lecturers, Admins) {
    //Init
    $scope.title = $stateParams.type ? $stateParams.type : 'Users';
    $scope.users = resolvedData.users;
    console.log($scope.users);

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Users',
      'icon': null,
      'state': 'users.list',
      'params': null
    };
    $rootScope.paths.length = 2;
    if ($stateParams.type){
      $rootScope.paths[2] = {
        'title': $stateParams.type,
        'icon': null,
        'state': 'users.list',
        'params': {
          'type': $stateParams.type
        }
      };
      $rootScope.paths.length = 3;
    }

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
                case 'students':
                  resource = Students;
                  break;
                case 'lecturers':
                  resource = Lecturers;
                  break;
                case 'admins':
                  resource = Admins;
                  break;
              }
              return resource.getById({
                id: $stateParams.id
              }).$promise.then(function(response){
                response.hasGroups = $stateParams.type == 'students' ? true : false;
                response.hasCourses = $stateParams.type == 'students' || $stateParams.type == 'lecturers' ? true : false;
                response.hasAttendances = $stateParams.type == 'students' ? true : false;
                response.hasGrades = $stateParams.type == 'students' ? true : false;
                angular.forEach(response.attendances, function(value, key) {
                  value.activity.type.tag = value.activity.type.name.substring(0,1);
                });
                angular.forEach(response.grades, function(value, key) {
                  value.activity.type.tag = value.activity.type.name.substring(0,1);
                });
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

app.controller('UsersViewController', ['$scope', '$rootScope', '$stateParams', 'Students', 'Groups', 'resolvedData', '$stateParams', function($scope, $rootScope, $stateParams, Students, Groups, resolvedData, $stateParams) {
    //Init
    $scope.user = resolvedData.user;
    $scope.user.type = $stateParams.type;
    $scope.user.tag = 'tag-'+$scope.user.type;
    $scope.title = $scope.user.lastName + " " + $scope.user.firstName;

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Users',
      'icon': null,
      'state': 'users.list',
      'params': null
    };
    $rootScope.paths[2] = {
      'title':  $scope.user.type,
      'icon': null,
      'state': 'users.list',
      'params': {
        type: $scope.user.type
      }
    };
    $rootScope.paths[3] = {
      'title':  $scope.user.lastName + " " + $scope.user.firstName,
      'icon': null,
      'state': 'users.view',
      'params': {
        type: $scope.user.type,
        id: $scope.user.id
      }
    };
    $rootScope.paths.length = 4;

    $scope.settings = {
      'editButtons' : false
    }

    console.log($scope.user);

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
      if ($stateParams.type === 'students'){
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
