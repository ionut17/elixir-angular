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
