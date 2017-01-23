app.config(function($stateProvider) {
    $stateProvider.state('activities', {
      template: '<div ui-view></div>'
    });
});

// Actitivities list
app.config(function($stateProvider) {
    $stateProvider.state('activities.list', {
        name: 'activities.list',
        url: '/activities',
        templateUrl: 'templates/activities-list.html',
        controller: 'ActivitiesListController',
        resolve: {
            resolvedData: ["Activities", "$http", "config", "$stateParams", function(Activities, $http, config, $stateParams) {
              //In case of no parameters, return default view
              return Activities.getView().$promise.then(function(response){
                //Insert appropiate tag
                angular.forEach(response, function(value, key) {
                  response[key].tag = "tag-"+value.activity.type.name;
                  response[key].roleTag = "tag-"+value.role;
                });
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

app.controller('ActivitiesListController', ['$scope', 'resolvedData', '$state', "$stateParams", function($scope, resolvedData, $state, $stateParams) {
    $scope.title = 'Activities';
    console.log(resolvedData);
    $scope.activities = resolvedData.activities;
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
              if ($stateParams.activity_id){
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
              } else{
                return resource.getAll().$promise.then(function(response){
                  response.type = $stateParams.type;
                  response.typeAll = true;
                  return {
                    activities: response
                  };
                }, function(response){
                  console.log(response);
                });
              }
            }]
        }
    });
});

app.controller('ActivitiesSubListController', ['$scope', 'resolvedData', '$state', "$stateParams", function($scope, resolvedData, $state, $stateParams) {
    console.log(resolvedData);
    $scope.activities = resolvedData.activities;
    $scope.title = $scope.activities.typeAll ? $scope.activities.type : $scope.activities[0].activity.name + "("+$scope.activities[0].activity.course.title+")";

    $scope.table = {
      showGrades : $scope.activities.type === 'grades'
    }
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

app.controller('ActivitiesViewController', ['$scope', 'resolvedData', function($scope, resolvedData) {
    $scope.activity = resolvedData.activity;
    console.log($scope.activity);
    $scope.title = $scope.activity.user.firstName +' '+ $scope.activity.user.lastName;

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
