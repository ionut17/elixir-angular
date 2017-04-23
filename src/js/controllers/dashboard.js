app.config(function($stateProvider, config) {
    $stateProvider.state('base.dashboard', {
        url: '/dashboard',
        templateUrl: 'templates/dashboard.html',
        controller: 'DashboardController',
        data: {
          authorizedRoles: config.authorizedRoles.dashboard.view
        },
        resolve: {
            resolvedData: ["Activities", "Files", "Courses", "$http", "config", "$stateParams", "$rootScope", "$q",
              function(Activities, Files, Courses, $http, config, $stateParams, $rootScope, $q) {
                return $q.all([
                  Activities.getAll().$promise,
                  Courses.getAll().$promise,
                  Files.getAll().$promise
                ]).then(function(response){
                  angular.forEach(response[0].content, function(activity, key){
                    activity.roleTag = ['tag',activity.role].join('-');
                    activity.activity.type.name = activity.activity.type.name[0];
                  });
                  angular.forEach(response[2].content, function(file, key){
                    file.activity.type.name = file.activity.type.name[0];
                  });
                  return {
                    'activities': response[0].content.slice(0,6),
                    'courses': response[1].content.slice(0,6),
                    'files': response[2].content.slice(0,6)
                  };
                }, function(error){
                  return error;
                });
            }]
        }
    });
});

app.controller('DashboardController', ['$scope','$rootScope','AuthService','config', 'resolvedData', 'languageTranslator', function($scope, $rootScope, AuthService, config, resolvedData, languageTranslator) {
    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': languageTranslator.menu.dashboard[$rootScope.language],
      'icon': null,
      'state': 'dashboard',
      'params': null
    };

    //Logic
    $scope.title = languageTranslator.menu.dashboard[$rootScope.language];
    $scope.isAuthorized = AuthService.isAuthorized;
    $scope.hasRole = AuthService.hasRole;
    $scope.authorizedRoles = config.authorizedRoles;
    $scope.user = $rootScope.authUser.user;

    //Parsing resolved data
    $scope.activities = resolvedData.activities;
    $scope.courses = resolvedData.courses;
    $scope.files = resolvedData.files;

    //Labels
    $scope.dashboardLabels = $rootScope.getTranslatedObject(languageTranslator.pages.dashboard);
    $scope.dashboardLabels.tables = $rootScope.getTranslatedObject(languageTranslator.tables);
    $scope.dashboardLabels.errors = $rootScope.getTranslatedObject(languageTranslator.errors);
}]);
