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
