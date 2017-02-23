app.config(function($stateProvider) {
    $stateProvider.state('base.users', {
      template: '<div ui-view></div>'
    });
});

// Users List
app.config(function($stateProvider, config) {
    $stateProvider.state('base.users.list', {
        url: '/users/:type',
        templateUrl: 'templates/users-list.html',
        controller: 'UsersListController',
        data: {
          authorizedRoles: config.authorizedRoles.users.list
        },
        params:  {
          type: {
            value: null,
            squash: true
          }
        },
        resolve: {
            resolvedData: ["Users", "Students", "Lecturers", "Admins", "$http", "config", "$stateParams", "$q", "$rootScope", function(Users, Students, Lecturers, Admins, $http, config, $stateParams, $q, $rootScope) {
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
                angular.forEach(response.content, function(value, key) {
                  value.tag = "tag-"+value.type;
                  if (!value.type){
                    value.type = role.slice(0,-1);
                  }
                });
                response.content.type = role;
                response.content.singleType = role == 'users' ? false : true;
                response.pager.pages = new Array(response.pager.totalPages > 0 ? response.pager.totalPages : 1);
                //Return modified response
                return {
                  users: response.content,
                  pager: response.pager,
                  resource: resource,
                  role: role
                };
              }, function(response){
                console.log(response);
                switch (response.status){
                  case 403:
                    $rootScope.$broadcast("not-authorized");
                  case 404:
                    $rootScope.$broadcast("not-found");
                  default:
                    $rootScope.$broadcast("unknown-error");
                }
                return $q.reject("Rejection message!");
              });
            }]
        }
    });
});

app.controller('UsersListController', ['$scope', '$rootScope', '$stateParams', 'config', 'resolvedData', 'Users', 'Students','Lecturers','Admins', function($scope, $rootScope, $stateParams, config, resolvedData, Users, Students, Lecturers, Admins) {
    //Init
    $scope.title = $stateParams.type ? $stateParams.type : 'Users';
    $scope.users = resolvedData.users;
    $scope.pager = resolvedData.pager;

    $scope.refresh = function(index){
      if (!index){
        index = 0;
      }
      var resource = resolvedData.resource, role = resolvedData.role;
      resource.getAll({
        'page':index,
        'search': $scope.search.value
      }).$promise.then(function(response){
        //Insert appropiate tag
        angular.forEach(response.content, function(value, key) {
          value.tag = "tag-"+value.type;
          if (!value.type){
            value.type = role.slice(0,-1);
          }
        });
        response.content.type = role;
        response.content.singleType = role == 'users' ? false : true;
        response.pager.pages = new Array(response.pager.totalPages > 0 ? response.pager.totalPages : 1);
        //Return modified response
        $scope.users = response.content;
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

    $scope.search = $rootScope.search;
    $rootScope.search.go = function(){
      $scope.refresh();
    }
    document.getElementById("search-bar-input").addEventListener("keydown", function (e) {
      if (e.keyCode === 13) {
        $rootScope.search.go();
      }
    });

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Users',
      'icon': null,
      'state': 'base.users.list',
      'params': null
    };
    $rootScope.paths.length = 2;
    if ($stateParams.type){
      $rootScope.paths[2] = {
        'title': $stateParams.type,
        'icon': null,
        'state': 'base.users.list',
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
app.config(function($stateProvider, config) {
    $stateProvider.state('base.users.view', {
        url: '/users/:type/:id/:detail?page',
        templateUrl: 'templates/users-view.html',
        controller: 'UsersViewController',
        data: {
          authorizedRoles: config.authorizedRoles.users.view
        },
        resolve: {
            resolvedData: ["Students", "Lecturers", "Admins", "$stateParams", "$q", "$rootScope", function(Students, Lecturers, Admins, $stateParams, $q, $rootScope) {
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
                response.hasFiles = $stateParams.type == 'students' ? true : false;
                angular.forEach(response.attendances, function(value, key) {
                  value.activity.type.tag = value.activity.type.name.substring(0,1);
                });
                angular.forEach(response.grades, function(value, key) {
                  value.activity.type.tag = value.activity.type.name.substring(0,1);
                });
                //Make detail call
                var content = null;
                response.detail = 'overview';
                if ($stateParams.detail){
                  var detailResource = resource;
                  response.hasAttendances = $stateParams.detail === 'attendances' ? true : false;
                  response.hasGrades = $stateParams.detail === 'grades' ? true : false;
                  response.hasFiles = $stateParams.detail === 'files' ? true : false;
                  response.hasGroups = $stateParams.detail === 'groups' ? true : false;
                  response.hasCourses = $stateParams.detail === 'courses' ? true : false;
                  response.detail = $stateParams.detail;
                  page = $stateParams.page ? parseInt($stateParams.page) : 0;
                  switch($stateParams.detail){
                    case 'attendances':
                      return detailResource.getAttendances({'id':$stateParams.id, 'page':page}).$promise.then(function(innerResponse){
                        response.attendances = innerResponse.content;
                        innerResponse.pager.pages = new Array(innerResponse.pager.totalPages > 0 ? innerResponse.pager.totalPages : 1);
                        return {
                          user: response,
                          pager: innerResponse.pager
                        };
                      }, function(innerResponse){});
                      break;
                    case 'grades':
                      return detailResource.getGrades({'id':$stateParams.id, 'page':page}).$promise.then(function(innerResponse){
                        response.attendances = innerResponse.content;
                        innerResponse.pager.pages = new Array(innerResponse.pager.totalPages > 0 ? innerResponse.pager.totalPages : 1);
                        return {
                          user: response,
                          pager: innerResponse.pager
                        };
                      }, function(innerResponse){});
                      break;
                    case 'files':
                      return detailResource.getFiles({'id':$stateParams.id, 'page':page}).$promise.then(function(innerResponse){
                        response.attendances = innerResponse.content;
                        innerResponse.pager.pages = new Array(innerResponse.pager.totalPages > 0 ? innerResponse.pager.totalPages : 1);
                        return {
                          user: response,
                          pager: innerResponse.pager
                        };
                      }, function(innerResponse){});
                      break;
                    case 'groups':
                      return detailResource.getGroups({'id':$stateParams.id, 'page':page}).$promise.then(function(innerResponse){
                        response.attendances = innerResponse.content;
                        innerResponse.pager.pages = new Array(innerResponse.pager.totalPages > 0 ? innerResponse.pager.totalPages : 1);
                        return {
                          user: response,
                          pager: innerResponse.pager
                        };
                      }, function(innerResponse){});
                      break;
                    case 'courses':
                      return detailResource.getCourses({'id':$stateParams.id, 'page':page}).$promise.then(function(innerResponse){
                        response.attendances = innerResponse.content;
                        innerResponse.pager.pages = new Array(innerResponse.pager.totalPages > 0 ? innerResponse.pager.totalPages : 1);
                        return {
                          user: response,
                          pager: innerResponse.pager
                        };
                      }, function(innerResponse){});
                      break;
                    default:
                      break;
                  }
                  //detail resource return error
                }
                else {
                  return {
                    user: response
                  };
                }
              }, function(response){
                console.log(response);
                $rootScope.$broadcast("not-authorized");
                return $q.reject("Rejection message!");
              });
            }]
        }
    });
});

app.controller('UsersViewController', ['$scope', '$rootScope', '$stateParams', 'Students', 'Groups', 'resolvedData', '$stateParams', '$state', function($scope, $rootScope, $stateParams, Students, Groups, resolvedData, $stateParams, $state) {
    //Init
    $scope.user = resolvedData.user;
    $scope.pager = resolvedData.pager ? resolvedData.pager : {};
    $scope.pager.getPage = function(index){
      $stateParams.page = index;
      $state.go('base.users.view', $stateParams, {reload: true});
    };

    $scope.user.type = $stateParams.type;
    $scope.user.tag = 'tag-'+$scope.user.type.slice(0,-1);
    $scope.user.tag = {
      name: $stateParams.type.slice(0,-1),
      class: 'tag-'+$stateParams.type.slice(0,-1)
    }
    $scope.title = $scope.user.lastName + " " + $scope.user.firstName;

    //TODO refresh function for working pagination on sub views
    console.log($scope.user);


    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Users',
      'icon': null,
      'state': 'base.users.list',
      'params': null
    };
    $rootScope.paths[2] = {
      'title':  $scope.user.type,
      'icon': null,
      'state': 'base.users.list',
      'params': {
        type: $scope.user.type
      }
    };
    $rootScope.paths[3] = {
      'title':  $scope.user.lastName + " " + $scope.user.firstName,
      'icon': null,
      'state': 'base.users.view',
      'params': {
        type: $scope.user.type,
        id: $scope.user.id,
        detail: null
      }
    };
    $rootScope.paths.length = 4;
    if ($stateParams.detail){
      $scope.title = [$scope.user.lastName, $scope.user.firstName,"-", $stateParams.detail].join(" ");
      $rootScope.paths[4] = {
        'title':  $stateParams.detail,
        'icon': null,
        'state': 'base.users.view',
        'params': {
          type: $scope.user.type,
          id: $scope.user.id,
          detail: $stateParams.detail
        }
      };
      $rootScope.paths.length = 5;
    }

    $scope.settings = {
      'editButtons' : false
    }

    // console.log($scope.user);

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
        // console.log(response);
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
