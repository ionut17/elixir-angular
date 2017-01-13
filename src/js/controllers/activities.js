app.config(function($stateProvider) {
    $stateProvider.state('activities', {
      template: '<div ui-view></div>'
    });
});

// Group list
app.config(function($stateProvider) {
    $stateProvider.state('activities.list', {
        name: 'activities.list',
        url: '/activities',
        templateUrl: 'templates/activities-list.html',
        controller: 'ActivitiesListController',
        resolve: {
            resolvedData: ["Activities", "$http", "config", function(Activities, $http, config) {
              return Activities.getView().$promise.then(function(response){
                //Insert appropiate tag
                angular.forEach(response, function(value, key) {
                  response[key].tag = "tag-"+value.type;
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

app.controller('ActivitiesListController', ['$scope', 'resolvedData', '$state', function($scope, resolvedData, $state) {
    $scope.title = 'Activities';
    console.log(resolvedData);
    $scope.activities = resolvedData.activities;
}]);

//Group view
app.config(function($stateProvider) {
    $stateProvider.state('activities.view', {
        name: 'activities.view',
        url: '/activities/:id',
        templateUrl: 'templates/activities-view.html',
        controller: 'ActivitiesViewController',
        resolve: {
            resolvedData: ["Activities", "$stateParams", function(Activities, $stateParams) {
              return Activities.getById({
                id: $stateParams.id
              }).$promise.then(function(response){
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
    $scope.activity = resolvedData.activities;
    $scope.title = "placeholder activity title";
}]);
