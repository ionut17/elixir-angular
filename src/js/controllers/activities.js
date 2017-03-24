app.config(function($stateProvider) {
    $stateProvider.state('base.activities', {
      template: '<div ui-view></div>'
    });
});

// Actitivities list
app.config(function($stateProvider, config) {
    $stateProvider.state('base.activities.list', {
        name: 'activities.list',
        url: '/activities/:course_id/:activity_id/:type?page&search',
        templateUrl: 'templates/activities-list.html',
        controller: 'ActivitiesListController',
        data: {
          authorizedRoles: config.authorizedRoles.activities.list
        },
        params:  {
          type: {
            value: null,
            squash: true
          },
          activity_id: {
            value: null,
            squash: true
          },
          course_id: {
            value: null,
            squash: true,
          }
        },
        resolve: {
            resolvedData: ["Activities", "Attendances", "Grades", "Files", "$http", "config", "$stateParams", "$rootScope", "$q", 'Courses', function(Activities, Attendances, Grades, Files, $http, config, $stateParams, $rootScope, $q, Courses) {
              var resource = null, role = null;
              var course_id = $stateParams.course_id !== null && $stateParams.course_id == parseInt($stateParams.course_id) ? parseInt($stateParams.course_id) : undefined;
              $stateParams.activity_id = course_id!==undefined ? $stateParams.activity_id : undefined;

              var id = $stateParams.activity_id !== null && $stateParams.activity_id == parseInt($stateParams.activity_id) ? parseInt($stateParams.activity_id) : undefined;
              // $stateParams.id = id;
              $stateParams.type = id!==undefined ? $stateParams.type : '';
              params = {
                'activity_id': id
              };
              switch($stateParams.type){
                case 'attendances':
                  resource = id === undefined ? Attendances.getAll : Attendances.getByActivityId;
                  role = 'attendances';
                  break;
                case 'grades':
                  resource = id === undefined ? Grades.getAll : Grades.getByActivityId;
                  role = 'grades';
                  break;
                case 'files':
                  resource = id === undefined ? Files.getAll : Files.getByActivityId;
                  role = 'files';
                  break;
                default:
                  resource = course_id === undefined ? Activities.getBasic : id === undefined ? Courses.getActivities : Activities.getByActivityId;
                  if (course_id !== undefined && id === undefined){
                    params.id = course_id;
                    delete params.activity_id;
                  }
                  role = 'activities';
                  break;
              }
              page = $stateParams.page ? parseInt($stateParams.page) : 0;
              search = $stateParams.search ? $stateParams.search : null;
              params.page = page;
              params.search = search;
              //In case of no parameters, return default view
              return resource(params).$promise.then(function(response){
                // Insert appropiate tag
                angular.forEach(response.content, function(value, key) {
                  if (!id){
                    value.activity = value;
                  } else{
                    value.tag = value.activity ? "tag-"+value.activity.type.name : '';
                    value.roleTag = "tag-"+value.role;
                    if (!value.role){
                      value.role = role.slice(0,-1);
                    }
                    if (value.student){
                      value.user = value.student;
                      delete value.student;
                    }
                  }
                });
                response.content.type = role;
                response.content.singleType = role == 'activities' ? false : true;
                response.pager.pages = new Array(response.pager.totalPages);
                //Return response
                if (course_id){
                  return Courses.getById({'id':course_id}).$promise.then(function(innerResponse){
                    if (id){
                      return Activities.getDetails({'id':id}).$promise.then(function(innerResponse2){
                        return {
                          activity: innerResponse2,
                          course: innerResponse,
                          activities: response.content,
                          pager: response.pager,
                          resource : resource,
                          role: role
                        };
                      }, function(innerResponse2){
                        // console.log(innerResponse2);
                        console.log(innerResponse2);
                        $rootScope.$broadcast("not-authorized");
                        return $q.reject("Rejection message!");
                      });
                    } else{
                      return {
                        activity: undefined,
                        course: innerResponse,
                        activities: response.content,
                        pager: response.pager,
                        resource : resource,
                        role: role
                      };
                    }
                  }, function(innerResponse){
                    // console.log(innerResponse);
                    console.log(innerResponse);
                    $rootScope.$broadcast("not-authorized");
                    return $q.reject("Rejection message!");
                  });
                } else{
                  return {
                    activity: undefined,
                    course: undefined,
                    activities: response.content,
                    pager: response.pager,
                    resource : resource,
                    role: role
                  };
                }
              }, function(response){
                // console.log(response);
                console.log(response);
                $rootScope.$broadcast("not-authorized");
                return $q.reject("Rejection message!");
              });
            }]
        }
    });
});

app.controller('ActivitiesListController', ['$scope', '$rootScope', 'resolvedData', '$state', "$stateParams", "Activities", "Attendances", "Grades", "Files", "AuthService", "Courses",
        function($scope, $rootScope, resolvedData, $state, $stateParams, Activities, Attendances, Grades, Files, AuthService, Courses) {
    //Init
    $scope.singleActivity = resolvedData.activity;
    $scope.singleCourse = resolvedData.course;
    $scope.activities = resolvedData.activities;
    $scope.pager = resolvedData.pager;
    $scope.title = $scope.activities.type;
    $scope.subtitle = $scope.singleActivity ? [$scope.singleActivity.name, $scope.singleActivity.course.title].join(' / ') : $scope.singleCourse ? $scope.singleCourse.title : 'All Courses';
    $scope.isAuthorized = AuthService.isAuthorized;

    //Get specific page
    var previousType = null;
    $scope.pager.getPage = function(index){
      $stateParams.page = index;
      $state.go('base.activities.list', $stateParams, {reload: true});
    };
    $scope.goTo = function(activity){
      var params = {
        type: activity.role !== undefined ? activity.role+'s' : undefined,
        course_id: activity.activity.course.id,
        activity_id: activity.activity.id
      };
      if ($scope.singleActivity){
        params.user_id = activity.user.id;
        params.file_id = activity.extraId >= 0 ? activity.extraId : undefined;
        params.file_id = activity.id !== undefined ? activity.id : params.file_id;
        $state.go('base.activities.view', params, {reload: true});
      } else{
        params.page = 0;
        $state.go('base.activities.list', params, {reload: true});
      }
    };

    // Search
    $scope.search = $rootScope.search;
    $scope.search.go = function(){
      $stateParams.page = 0;
      $stateParams.search = $scope.search.value;
      $state.go('base.activities.list', $stateParams, {reload: true});
    }
    document.getElementById("search-bar-input").addEventListener("keydown", function (e) {
      if (e.keyCode === 13) {
        $rootScope.search.go();
      }
    });

    //Courses
    $scope.selectedCourse = $scope.singleCourse;
    $scope.courses = undefined;
    if ($scope.singleActivity === undefined){
      Courses.getAllUnpaged().$promise.then(function(response){
        $scope.courses = response;
      }, function(response){});
    };
    $scope.changeCourse = function(course){
      var params = {
        type: undefined,
        course_id: course,
        activity_id: undefined,
        page: 0
      };
      $state.go('base.activities.list', params, {reload: true});
    };

    //Buttons
    $scope.titleButton = {
      text: 'Add Activity'
    }

    //Modals
    $scope.modal = $rootScope.modal;

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Activities',
      'icon': null,
      'state': 'base.activities.list',
      'params': {
        'type': null,
        'course_id': null,
        'activity_id': null
      }
    };
    $rootScope.paths.length = 2;
    if ($scope.singleCourse){
      $rootScope.paths[2] = {
        'title': $scope.singleCourse.title,
        'icon': null,
        'state': 'base.activities.list',
        'params': {
          'type': null,
          'course_id': $scope.singleCourse.id,
          'activity_id': null,
        }
      };
      $rootScope.paths.length = 3;
      if ($scope.singleActivity){
        $rootScope.paths[3] = {
          'title': $scope.singleActivity.name,
          'icon': null,
          'state': 'base.activities.list',
          'params': {
            'type': null,
            'course_id': $scope.singleCourse.id,
            'activity_id': $scope.singleActivity.id
          }
        };
        $rootScope.paths.length = 4;
      }
      if($stateParams.type){
        $rootScope.paths[4] = {
          'title': $stateParams.type,
          'icon': null,
          'state': 'base.activities.list',
          'params': {
            'type': $stateParams.type,
            'course_id': $scope.singleCourse.id,
            'activity_id': $scope.singleActivity.id
          }
        };
        $rootScope.paths.length = 5;
      }
    }

    //Logic
    // console.log(resolvedData);
}]);

//Sub-Activities List
app.config(function($stateProvider, config) {
    $stateProvider.state('base.activities.sublist', {
        name: 'base.activities.sublist',
        url: '/activities/course/:course_id/:activity_id/:type?page',
        templateUrl: 'templates/activities-sublist.html',
        controller: 'ActivitiesSubListController',
        data: {
          authorizedRoles: config.authorizedRoles.activities.sublist
        },
        resolve: {
            resolvedData: ["Attendances", "Grades", "Files", "$http", "config", "$stateParams", "$rootScope", "$q", "Courses", function(Attendances, Grades, Files, $http, config, $stateParams, $rootScope, $q, Courses) {
              console.log($stateParams);
              return Courses.getById({
                id: $stateParams.course_id
              }).$promise.then(function(response){
                page = $stateParams.page ? parseInt($stateParams.page) : 0;
                return Courses.getActivities({'id':$stateParams.course_id, 'page':page}).$promise.then(function(innerResponse){
                  innerResponse.pager.pages = new Array(innerResponse.pager.totalPages > 0 ? innerResponse.pager.totalPages : 1);
                  return {
                    course: response,
                    activities: innerResponse.content,
                    pager: innerResponse.pager
                  };
                }, function(innerResponse){
                  $rootScope.$broadcast("not-authorized");
                  return $q.reject("Rejection message!");
                });
              }, function(response){});
            }]
        }
    });
});

app.controller('ActivitiesSubListController', ['$scope', '$rootScope', 'resolvedData', '$state', "$stateParams", function($scope, $rootScope, resolvedData, $state, $stateParams) {
    //Init
    $scope.course = resolvedData.course;
    $scope.activities = resolvedData.activities;
    $scope.pager = resolvedData.pager;
    $scope.title = $scope.course.title + ' - Activities';
    $scope.table = {
      showGrades : $scope.activities.type === 'grades'
    }

    $scope.update = function(index){
      if (!index){
        index = 0;
      }
      resolvedData.resource.getByActivityId({
        activity_id: $stateParams.activity_id,
        page: index
      }).$promise.then(function(response){
        response.content.type = $stateParams.type;
        response.content.activityId = $stateParams.activity_id;
        response.content.typeAll = false;
        response.pager.pages = new Array(response.pager.totalPages);
        //return
        $scope.activities = response.content;
        $scope.pager = response.pager;
        $scope.pager.getPage = function(index){
          $scope.refresh(index);
        };
      }, function(response){
        console.log(response);
      });
    }
    //Get specific page
    $scope.pager.getPage = function(index){
      $stateParams.page = index;
      $state.go('base.activities.sublist', $stateParams, {reload: true});
    };

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Activities',
      'icon': null,
      'state': 'base.activities.list',
      'params': null
    };
    $rootScope.paths[2] = {
      'title': $scope.course.title,
      'icon': null,
      'state': 'base.activities.sublist',
      'params': {
        course_id: $scope.course.id
      }
    };
    $rootScope.paths.length = 3;

    //Logic
    console.log(resolvedData);
}]);

//Activity detail view
app.config(function($stateProvider, config) {
    $stateProvider.state('base.activities.view', {
        name: 'base.activities.view',
        url: '/activities/:course_id/:activity_id/:type/:user_id/:file_id',
        templateUrl: 'templates/activities-view.html',
        controller: 'ActivitiesViewController',
        data: {
          authorizedRoles: config.authorizedRoles.activities.list
        },
        params:  {
          course_id: {
            value: null,
            squash: true
          },
          activity_id: {
            value: null,
            squash: true
          },
          type: {
            value: null,
            squash: true,
          },
          user_id: {
            value: null,
            squash: true,
          },
          file_id: {
            value: null,
            squash: true,
          }
        },
        resolve: {
            resolvedData: ["Attendances", "Grades", "Files", "$stateParams", "$rootScope", "$q", function(Attendances, Grades, Files, $stateParams, $rootScope, $q) {
              var resource;
              var params;
              switch($stateParams.type){
                case 'attendances':
                  resource = Attendances;
                  params = {
                    student_id: $stateParams.user_id,
                    activity_id: $stateParams.activity_id,
                  };
                  break;
                case 'grades':
                  resource = Grades;
                  params = {
                    student_id: $stateParams.user_id,
                    activity_id: $stateParams.activity_id,
                  };
                  break;
                case 'files':
                  resource = Files;
                  params = {
                    file_id: $stateParams.file_id,
                  };
                  break;
              }
              return resource.getById(params).$promise.then(function(response){
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
                $rootScope.$broadcast("not-authorized");
                return $q.reject("Rejection message!");
              });
            }]
        }
    });
});

app.controller('ActivitiesViewController', ['$scope', '$rootScope', 'resolvedData', 'config', function($scope, $rootScope, resolvedData, config) {
    //Init
    $scope.activity = resolvedData.activity;
    $scope.title = [$scope.activity.user.firstName,$scope.activity.user.lastName,'-',$scope.activity.type.slice(0,-1),'at',$scope.activity.activity.type.name,'(',$scope.activity.activity.course.title,')'].join(' ');

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Activities',
      'icon': null,
      'state': 'base.activities.list',
      'params': null
    };
    $rootScope.paths[2] = {
      'title': $scope.activity.type,
      'icon': null,
      'state': 'base.activities.list',
      'params': {
        type: $scope.activity.type
      }
    };
    $rootScope.paths[3] = {
      'title': $scope.activity.activity.name + " ("+$scope.activity.activity.course.title+")",
      'icon': null,
      'state': 'base.activities.sublist',
      'params': {
        type: $scope.activity.type,
        activity_id: $scope.activity.id.activityId
      }
    };

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Activities',
      'icon': null,
      'state': 'base.activities.list',
      'params': {
        'type': null,
        'course_id': null,
        'activity_id': null
      }
    };
    $rootScope.paths[2] = {
        'title': $scope.activity.activity.course.title,
        'icon': null,
        'state': 'base.activities.list',
        'params': {
          'type': null,
          'course_id': $scope.activity.activity.course.id,
          'activity_id': null,
        }
      };
    $rootScope.paths[3] = {
        'title': $scope.activity.activity.name,
        'icon': null,
        'state': 'base.activities.list',
        'params': {
          'type': null,
          'course_id': $scope.activity.activity.course.id,
          'activity_id': $scope.activity.activity.id
        }
      };
    $rootScope.paths[4] = {
        'title': $scope.activity.type,
        'icon': null,
        'state': 'base.activities.list',
        'params': {
          'type': $scope.activity.type,
          'course_id': $scope.activity.activity.course.id,
          'activity_id': $scope.activity.activity.id
        }
      };
    $rootScope.paths[5] = {
        'title': $scope.activity.user.firstName +' '+ $scope.activity.user.lastName,
        'icon': null,
        'state': 'base.activities.view',
        'params': {
          'type': $scope.activity.type,
          'course_id': $scope.activity.activity.course.id,
          'activity_id': $scope.activity.activity.id,
          'user_id': $scope.activity.user.id
        }
      };
    $rootScope.paths.length = 6;

    //Logic
    $scope.table = {
      title : $scope.activity.type.slice(0,-1) + " Details",
      columns : {
        user: $scope.activity.user.type.capitalizeFirstLetter(),
        activity: 'Activity',
        course: 'Course'
      },
      retrieveLink : function(){
        return config.apiEndpoint+'storage/retrieve/'+$scope.activity.id+'?k='+$rootScope.authUser.token;
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
        $scope.table.extraRows = [{
            title : 'File',
            value : $scope.activity.fileName+'.'+$scope.activity.extension,
            customClass : '',
            hasDownloadButton: true,
          },{
            title: 'Type',
            value : $scope.activity.extension,
            customClass : 'tag tag-auto tag-file'
          }
        ]
        break;
    }
}]);
