app.config(function($stateProvider) {
    $stateProvider.state('base.courses', {
      template: '<div ui-view></div>'
    });
});

// Courses list
app.config(function($stateProvider, config) {
    $stateProvider.state('base.courses.list', {
        name: 'base.courses.list',
        url: '/courses',
        templateUrl: 'templates/courses-list.html',
        controller: 'CoursesListController',
        data: {
          authorizedRoles: config.authorizedRoles.courses.list
        },
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
      'state': 'base.courses.list',
      'params': null
    };
    $rootScope.paths.length = 2;
}]);

//Course view
app.config(function($stateProvider, config) {
    $stateProvider.state('base.courses.view', {
        name: 'base.courses.view',
        url: '/courses/:id',
        templateUrl: 'templates/courses-view.html',
        controller: 'CoursesViewController',
        data: {
          authorizedRoles: config.authorizedRoles.courses.view
        },
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
      'state': 'base.courses.list',
      'params': null
    };
    $rootScope.paths[2] = {
      'title': $scope.course.title,
      'icon': null,
      'state': 'base.courses.view',
      'params': {
        id: $scope.course.id
      }
    };
    $rootScope.paths.length = 3;
}]);
