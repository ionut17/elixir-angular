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
