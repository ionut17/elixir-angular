app.config(function($stateProvider) {
    $stateProvider.state('courses', {
        url: '/courses',
        templateUrl: 'templates/courses.html',
        controller: 'CoursesController'
    });
});

app.controller('CoursesController', ['$scope', function($scope) {
    $scope.title = 'Courses';
}]);
