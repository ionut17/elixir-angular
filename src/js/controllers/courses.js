app.config(function($stateProvider) {
    $stateProvider.state('base.courses', {
      template: '<div ui-view></div>'
    });
});

// Courses list
app.config(function($stateProvider, config) {
    $stateProvider.state('base.courses.list', {
        name: 'base.courses.list',
        url: '/courses?page&search',
        templateUrl: 'templates/courses-list.html',
        controller: 'CoursesListController',
        data: {
          authorizedRoles: config.authorizedRoles.courses.list
        },
        resolve: {
            resolvedData: ["Courses", "$http", "config", "$rootScope", "$q", "$stateParams", function(Courses, $http, config, $rootScope, $q, $stateParams) {
              search = $stateParams.search ? $stateParams.search : null;
              page = $stateParams.page ? parseInt($stateParams.page) : 0;
              return Courses.getAll({'page':page, 'search':search}).$promise.then(function(response){
                console.log(response);
                response.pager.pages = new Array(response.pager.totalPages);
                return {
                  courses: response.content,
                  pager: response.pager
                };
              },function(response){
                console.log(response);
                $rootScope.$broadcast("not-authorized");
                return $q.reject("Rejection message!");
              });
            }]
        }
    });
});

app.controller('CoursesListController', ['$scope', '$rootScope', 'resolvedData', '$state', 'Courses', '$stateParams','languageTranslator', 'NotificationService', 'NOTIFICATIONS_TYPES',
        function($scope, $rootScope, resolvedData, $state, Courses, $stateParams, languageTranslator, NotificationService, NOTIFICATIONS_TYPES) {
    //Init
    $scope.title = languageTranslator.tables.courses[$rootScope.language];
    $scope.courses = resolvedData.courses;
    $scope.pager = resolvedData.pager;

    $scope.getPage = function(index){
      $stateParams.page = index;
      $state.go('base.courses.list', $stateParams, {reload: true});
    };

    // Search
    $scope.search = $rootScope.search;
    $scope.search.go = function(){
      $stateParams.page = 0;
      $stateParams.search = $scope.search.value;
      $state.go('base.courses.list', $stateParams, {reload: true});
    }
    document.getElementById("search-bar-input").addEventListener("keydown", function (e) {
      if (e.keyCode === 13) {
        $rootScope.search.go();
      }
    });

    $scope.labels = {
      placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders),
      table: $rootScope.getTranslatedObject(languageTranslator.tables),
      errors: $rootScope.getTranslatedObject(languageTranslator.errors),
      buttons: $rootScope.getTranslatedObject(languageTranslator.buttons),
      marked: languageTranslator.modals.addGrades.marked[$rootScope.language]
    };

    // Delete
    $scope.delete = function(params){
      var requestBody = {
        course_id: params.id
      };
      var label = $scope.labels.table.course;
      //Removing course
      Courses.delete(requestBody).$promise.then(function(response){
        $stateParams.page = $scope.pager.currentPageSize == 1  && $scope.pager.currentPage > 0 ? parseInt($stateParams.page) - 1 : $stateParams.page;
        $state.go('base.courses.list', $stateParams, {reload: true});
        NotificationService.push({
          title: label+' Deleted',
          content: ['You have successfully deleted the',params.title,'course.'].join(' '),
          link: null,
          type: NOTIFICATIONS_TYPES.success
        });
      }, function(response){
        console.log(response);
        NotificationService.push({
          title: label+' Not Deleted',
          content: 'An error has occured. The '+label+' hasn\'t been deleted.',
          link: null,
          type: NOTIFICATIONS_TYPES.error
        });
      });
    };

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': languageTranslator.tables.courses[$rootScope.language],
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
        url: '/courses/:id/:detail?page',
        templateUrl: 'templates/courses-view.html',
        controller: 'CoursesViewController',
        data: {
          authorizedRoles: config.authorizedRoles.courses.view
        },
        resolve: {
            resolvedData: ["Courses", "$stateParams", "$q", "$rootScope", function(Courses, $stateParams, $q, $rootScope) {
              return Courses.getById({
                id: $stateParams.id
              }).$promise.then(function(response){
                response.detail = 'overview';
                if ($stateParams.detail){
                  page = $stateParams.page ? parseInt($stateParams.page) : 0;
                  response.detail = $stateParams.detail;
                  response.hasLecturers = $stateParams.detail === 'lecturers' ? true : false;
                  response.hasStudents = $stateParams.detail === 'students' ? true : false;
                  response.hasActivities = $stateParams.detail === 'activities' ? true : false;
                  switch($stateParams.detail){
                    case 'lecturers':
                      return Courses.getLecturers({'id':$stateParams.id, 'page':page}).$promise.then(function(innerResponse){
                        response.lecturers = innerResponse.content;
                        innerResponse.pager.pages = new Array(innerResponse.pager.totalPages > 0 ? innerResponse.pager.totalPages : 1);
                        return {
                          course: response,
                          pager: innerResponse.pager
                        };
                      }, function(innerResponse){});
                    case 'students':
                      return Courses.getStudents({'id':$stateParams.id, 'page':page}).$promise.then(function(innerResponse){
                        response.students = innerResponse.content;
                        innerResponse.pager.pages = new Array(innerResponse.pager.totalPages > 0 ? innerResponse.pager.totalPages : 1);
                        return {
                          course: response,
                          pager: innerResponse.pager
                        };
                      }, function(innerResponse){});
                    case 'activities':
                      return Courses.getActivities({'id':$stateParams.id, 'page':page}).$promise.then(function(innerResponse){
                        response.activities = innerResponse.content;
                        innerResponse.pager.pages = new Array(innerResponse.pager.totalPages > 0 ? innerResponse.pager.totalPages : 1);
                        return {
                          course: response,
                          pager: innerResponse.pager
                        };
                      }, function(innerResponse){});
                    default:
                      break;
                  }
                }
                //Else
                return {
                  course: response
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

app.controller('CoursesViewController', ['$scope', '$rootScope', 'resolvedData', '$stateParams', '$state', 'languageTranslator', function($scope, $rootScope, resolvedData, $stateParams, $state, languageTranslator) {
    //Init
    $scope.course = resolvedData.course;
    $scope.pager = resolvedData.pager ? resolvedData.pager : {};
    $scope.pager.getPage = function(index){
      $stateParams.page = index;
      $state.go('base.courses.view', $stateParams, {reload: true});
    };
    $scope.title = $scope.course.title;
    $scope.authUser = $rootScope.authUser.user;

    console.log($scope.course.activities);

    $scope.labels = {
      placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders),
      table: $rootScope.getTranslatedObject(languageTranslator.tables),
      errors: $rootScope.getTranslatedObject(languageTranslator.errors),
      buttons: $rootScope.getTranslatedObject(languageTranslator.buttons),
      marked: languageTranslator.modals.addGrades.marked[$rootScope.language]
    };


    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': languageTranslator.tables.courses[$rootScope.language],
      'icon': null,
      'state': 'base.courses.list',
      'params': null
    };
    $rootScope.paths[2] = {
      'title': $scope.course.title,
      'icon': null,
      'state': 'base.courses.view',
      'params': {
        id: $scope.course.id,
        detail: null
      }
    };
    $rootScope.paths.length = 3;
    if ($stateParams.detail){
      $scope.title = [$scope.course.title,"-", $stateParams.detail].join(" ");
      $rootScope.paths[3] = {
        'title':  $stateParams.detail,
        'icon': null,
        'state': 'base.courses.view',
        'params': {
          id: $scope.course.id,
          detail: $stateParams.detail
        }
      };
      $rootScope.paths.length = 4;
    }
}]);
