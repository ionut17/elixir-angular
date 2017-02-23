app.config(function($stateProvider) {
    $stateProvider.state('base.activities', {
      template: '<div ui-view></div>'
    });
});

// Actitivities list
app.config(function($stateProvider, config) {
    $stateProvider.state('base.activities.list', {
        name: 'activities.list',
        url: '/activities/:type',
        templateUrl: 'templates/activities-list.html',
        controller: 'ActivitiesListController',
        data: {
          authorizedRoles: config.authorizedRoles.activities.list
        },
        // params:  {
        //   type: {
        //     value: null,
        //     squash: true
        //   }
        // },
        resolve: {
            resolvedData: ["Activities", "Attendances", "Grades", "Files", "$http", "config", "$stateParams", "$rootScope", "$q", function(Activities, Attendances, Grades, Files, $http, config, $stateParams, $rootScope, $q) {
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
                angular.forEach(response.content, function(value, key) {
                  value.tag = "tag-"+value.activity.type.name;
                  value.roleTag = "tag-"+value.role;
                  if (!value.role){
                    value.role = role.slice(0,-1);
                  }
                  if (value.student){
                    value.user = value.student;
                    delete value.student;
                  }
                });
                response.content.type = role;
                response.content.singleType = role == 'activities' ? false : true;
                response.pager.pages = new Array(response.pager.totalPages);
                //Return response
                return {
                  activities: response.content,
                  pager: response.pager,
                  resource : resource,
                  role: role
                };
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

app.controller('ActivitiesListController', ['$scope', '$rootScope', 'resolvedData', '$state', "$stateParams", "Activities", "Attendances", "Grades", "Files", function($scope, $rootScope, resolvedData, $state, $stateParams, Activities, Attendances, Grades, Files) {
    //Init
    $scope.activities = resolvedData.activities;
    $scope.pager = resolvedData.pager;
    $scope.title = $scope.activities.type;

    $scope.refresh = function(index){
      if (!index){
        index = 0;
      }
      resolvedData.resource.getAll({'page':index}).$promise.then(function(response){
        //Insert appropiate tag
        angular.forEach(response.content, function(value, key) {
          value.tag = "tag-"+value.activity.type.name;
          value.roleTag = "tag-"+value.role;
          if (!value.role){
            value.role = role.slice(0,-1);
          }
          if (value.student){
            value.user = value.student;
            delete value.student;
          }
        });
        response.content.type = resolvedData.role;
        response.content.singleType = role == 'activities' ? false : true;
        response.pager.pages = new Array(response.pager.totalPages);
        //Return response
        $scope.activities = response.content;
        $scope.pager = response.pager;
        //Get specific page
        $scope.pager.getPage = function(index){
          $scope.refresh(index);
        };
      }, function(response){
        console.log(response);
        return [];
      });
    };
    //Get specific page
    $scope.pager.getPage = function(index){
      $scope.refresh(index);
    };

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Activities',
      'icon': null,
      'state': 'base.activities.list',
      'params': {
        'type': null
      }
    };
    $rootScope.paths.length = 2;
    if($stateParams.type){
      $rootScope.paths[2] = {
        'title': $stateParams.type,
        'icon': null,
        'state': 'base.activities.list',
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
app.config(function($stateProvider, config) {
    $stateProvider.state('base.activities.sublist', {
        name: 'base.activities.sublist',
        url: '/activities/:type/:activity_id',
        templateUrl: 'templates/activities-sublist.html',
        controller: 'ActivitiesSubListController',
        data: {
          authorizedRoles: config.authorizedRoles.activities.sublist
        },
        resolve: {
            resolvedData: ["Attendances", "Grades", "Files", "$http", "config", "$stateParams", "$rootScope", "$q", function(Attendances, Grades, Files, $http, config, $stateParams, $rootScope, $q) {
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
                response.content.type = $stateParams.type;
                response.content.activityId = $stateParams.activity_id;
                response.content.typeAll = false;
                response.pager.pages = new Array(response.pager.totalPages);
                return {
                  activities: response.content,
                  pager: response.pager,
                  resource: resource,
                  role: role
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

app.controller('ActivitiesSubListController', ['$scope', '$rootScope', 'resolvedData', '$state', "$stateParams", function($scope, $rootScope, resolvedData, $state, $stateParams) {
    //Init
    $scope.activities = resolvedData.activities;
    $scope.pager = resolvedData.pager;
    $scope.title = [$scope.activities.typeAll ? $scope.activities.type : $scope.activities[0].activity.name,"(",$scope.activities[0].activity.course.title,")"].join(" ");
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
      $scope.refresh(index);
    };

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Activities',
      'icon': null,
      'state': 'base.activities.list',
      'params': null
    };
    $rootScope.paths[2] = {
      'title': $scope.activities.type,
      'icon': null,
      'state': 'base.activities.list',
      'params': {
        type: $scope.activities.type
      }
    };
    $rootScope.paths.length = 3;
    if (!$scope.activities.typeAll){
      $rootScope.paths[3] = {
        'title': $scope.activities[0].activity.name + " ("+$scope.activities[0].activity.course.title+")",
        'icon': null,
        'state': 'base.activities.sublist',
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
app.config(function($stateProvider, config) {
    $stateProvider.state('base.activities.view', {
        name: 'base.activities.view',
        url: '/activities/:type/:activity_id/:user_id',
        templateUrl: 'templates/activities-view.html',
        controller: 'ActivitiesViewController',
        data: {
          authorizedRoles: config.authorizedRoles.activities.list
        },
        resolve: {
            resolvedData: ["Attendances", "Grades", "Files", "$stateParams", "$rootScope", "$q", function(Attendances, Grades, Files, $stateParams, $rootScope, $q) {
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
    $rootScope.paths[4] = {
      'title': $scope.activity.user.firstName +' '+ $scope.activity.user.lastName,
      'icon': null,
      'state': 'base.activities.view',
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
      retrieveLink : function(){
        return config.apiEndpoint+'storage/retrieve/'+$scope.activity.fileId+'?k='+$rootScope.authUser.token;
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
