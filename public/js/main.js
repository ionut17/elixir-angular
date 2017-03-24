var app = angular.module('app', ['ui.router', 'ngResource', 'ngCookies']);

app.config(function($urlRouterProvider, $locationProvider) {

    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/login');

    //Extra functions
    String.prototype.capitalizeFirstLetter = function() {
      return this.charAt(0).toUpperCase() + this.slice(1);
    }
    Date.prototype.addHours = function(h) {
      this.setTime(this.getTime() + (h*60*60*1000));
      return this;
    }

});

app.run(function($rootScope, $timeout, $state, $cookies, config) {
  $rootScope.$state = $state;
  $rootScope.loading = false;
  var cookieAuthUser = $cookies.getObject('authUser');
  if (cookieAuthUser){
    $rootScope.authUser = $cookies.getObject('authUser');
  } else{
    $rootScope.authUser = {
      token: null,
      user: {
        firstName: null,
        lastName: null,
        email: null
      }
    }
  }

  $rootScope.paths = [{
    'title': '',
    'icon': 'dashboard',
    'state': 'base.dashboard',
    'params': null
  }];
  $rootScope.getPath = function(state, paramObj){
    return $state.href(state, paramObj);
  }

  $rootScope.icons = {
    'type' : config.icons,
    'showAwesome' : config.icons == 'awesome',
    'showMaterial' : config.icons != 'awesome'
  }

  $rootScope.search = {
    value: null,
    go: function(){
      $scope.refresh();
    },
    clear: function(){
      this.value = null;
      this.go();
    }
  };

  if (!config.development){
    $rootScope.$on('$stateChangeSuccess', function(event, toState){
      var stateName = $state.current.name;
      if (stateName.substring(0,5) === 'base.'){
        stateName = stateName.substring(5);
      }
      // console.log(stateName);
      if ($rootScope.authUser.user){
        mixpanel.identify($rootScope.authUser.user.type+$rootScope.authUser.user.id);
        mixpanel.people.set({
            "$first_name": $rootScope.authUser.user.firstName,
            "$last_name": $rootScope.authUser.user.lastName,
            "$created": new Date().getDate(),
            "$email": $rootScope.authUser.user.email
        });
      }
      mixpanel.track("Page Visit", {
        "Page": stateName
      });
    });
  }

  //Notifications wrapper
  $rootScope.notifications = {
    active: [],
    showDate: config.notifications.showDate,
    append: function(notification){
      var dateObj = new Date();
      $rootScope.notifications.active.push({
        date: [dateObj.getHours(),dateObj.getMinutes()].join(':'),
        title: notification.title,
        content: notification.content,
        link: notification.link,
        type: notification.type
      });
      return $rootScope.notifications.active.length-1;
    },
    dismiss: function(index){
      if (index){
        $rootScope.notifications.active.splice(index,1);
      } else{
        $rootScope.notifications.active.splice(0,1);
      }
    }
  };

});

//Base.js
app.config(function($stateProvider) {
  $stateProvider.state('base', {
    templateUrl: 'templates/base.html',
    controller: 'BaseController',
  });
});

app.controller('BaseController', ['$scope', '$rootScope', '$q', 'AuthService', '$state', '$timeout', 'config', 'NOTIFICATIONS_TYPES', 'NotificationService', 'Courses', 'Activities', 'Files',
      function($scope, $rootScope, $q, AuthService, $state, $timeout, config, NOTIFICATIONS_TYPES, NotificationService, Courses, Activities, Files) {
  $scope.logout = function(){
    AuthService.logout();
    NotificationService.push({
      title: 'Logged out',
      content: 'You haved logged out of your account.',
      link: null,
      type: NOTIFICATIONS_TYPES.default
    });
  }
  $scope.isAuthorized = AuthService.isAuthorized;
  $scope.authorizedRoles = config.authorizedRoles;

  $scope.loading = false;
  $scope.authUser = {
    username: $rootScope.authUser.user.firstName+' '+$rootScope.authUser.user.lastName,
    email: $rootScope.authUser.user.email,
    type: $rootScope.authUser.user.type,
    group: $rootScope.authUser.user.type+'s',
    id: $rootScope.authUser.user.id,
    class: 'tag-'+$rootScope.authUser.user.type
  }

  $scope.toggleMenu = function(){
    var body = angular.element('.body-container');
    if (body.hasClass('menu-off')){
      body.removeClass('menu-off');
    } else{
      body.addClass('menu-off');
    }
  }


  //Notifications wrapper
  $scope.notifications = $rootScope.notifications;
  //Notifications listener
  $scope.$on('not-authorized', function (event) {
    NotificationService.push({
      title: 'Not authorized',
      content: 'You are not allowed to view the requested resource.',
      link: null,
      type: NOTIFICATIONS_TYPES.error
    });
  });
  $scope.$on('not-found', function (event) {
    NotificationService.push({
      title: 'Not found',
      content: 'You are not allowed to view the requested resource.',
      link: null,
      type: NOTIFICATIONS_TYPES.error
    });
  });
  //Loading listener
  $scope.loading = false;
  $scope.$on('start-loading', function (event) {
    $scope.loading = true;
  });
  $scope.$on('stop-loading', function (event) {
    $scope.loading = false;
  });


  //TODO insert restrictions based on role (pending api restrictions based on token)
  //TODO impose these restrictions on url guessing as well
  $rootScope.$on('$stateChangeStart', function (event, next) {
    if (next.data && next.data.authorizedRoles){
      var authorizedRoles = next.data.authorizedRoles;
      // console.log(authorizedRoles);
      if (!AuthService.isAuthorized(authorizedRoles)) {
        event.preventDefault();
        if (AuthService.isAuthenticated()) {
          // user is not allowed
          // console.log("not-authorized");
          $rootScope.$broadcast("not-authorized");
        } else {
          // user is not logged in
          // console.log("not-authenticated");
          $rootScope.$broadcast("not-authenticated");
        }
      } else{
        $rootScope.$broadcast("start-loading");
      }
    }
  });
  $rootScope.$on('$stateChangeSuccess', function(event, toState){
    // $timeout(function(){
      $rootScope.$broadcast("stop-loading");
      // mixpanel.track("Video play", {
      //   "Page":
      // });
    // }, 500);
  });

  //TODO insert middleware to handle authentication filtering
  if (!AuthService.isAuthenticated()){
    NotificationService.push({
      title: 'Not authenticated',
      content: 'You are not logged in or your session expired. Please login again.',
      link: null,
      type: NOTIFICATIONS_TYPES.error
    });
    $state.go('login');
  };

  $rootScope.modal = {
    'local': {},
    'confirm': {
      action: {
        value: null,
        submit: function(){
          angular.element('#confirm-modal').modal('hide');
          angular.element('.modal-backdrop').remove();
          $scope.modal.confirm.action.value();
        }
      },
      title: 'Logout confirmation?',
      cancel: 'Cancel',
      submit: 'Logout',
      data: {},
      loading: false,
      this: function(callback){
        angular.element('#confirm-modal').modal('show');
        $scope.modal.confirm.action.value = callback;
      }
    },
    'add-activity': {
      action: {
        value: function(){},
        submit: function(data){
          $scope.modal["add-activity"].loading = true;
          //Parse submit action here
          data.date = $('#add-activity-datepicker').datepicker().data('datepicker').currentDate.getTime();
          //Data
          Activities.addActivity(data).$promise.then(function(response){
            angular.element('#add-activity').modal('hide');
            angular.element('.modal-backdrop').remove();
            $scope.modal["add-activity"].loading = false;
            $state.reload();
            //Send success notification
            console.log('activity response',response);
            NotificationService.push({
              title: 'Activity Created',
              content: ['You have successfully created the activity ',data.name,'.'].join(''),
              link: null,
              type: NOTIFICATIONS_TYPES.success
            });
          }, function(response){
            console.log(response);
            $scope.modal["add-activity"].loading = false;
          });
        }
      },
      title: 'Add Activity',
      cancel: 'Cancel',
      submit: 'Add Activity',
      data: {},
      loading: false,
      this: function(targetCourse){
          $scope.modal["add-activity"].loading = true;
          //Getting dependencies
          $q.all([
            Courses.getAllUnpaged().$promise,
            Activities.getTypes().$promise
          ]).then(function(response){
            //Modify course titles
            angular.forEach(response[0], function(value, key) {
               value.title = [Array(value.year+1).join('I'),value.semester,' - ',value.title].join('');
            });
            response[0].sort( function(a,b) {return (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0);} );
            //Append data
            $scope.modal["add-activity"].data.courses = response[0];
            $scope.modal["add-activity"].data.types = response[1];
            //Set start date
            var currentDate = new Date();
            currentDate.setMinutes(0);
            currentDate.setSeconds(0);
            currentDate.setMilliseconds(0);
            $('#add-activity-datepicker').datepicker({
              language: 'ro',
              position: 'bottom left',
              minDate: currentDate,
              startDate: currentDate,
              timepicker: 'true',
              minutesStep: 10
            });
            //Set default selected course if applicable
            $scope.modal.local.courseId = targetCourse !== undefined ? targetCourse.id : undefined;
            $scope.modal["add-activity"].loading = false;
          });
          //Got dependencies
          angular.element('#add-activity').modal('show');
      }
    },
    'add-file': {
      action: {
        value: function(){},
        submit: function(data){
          $scope.modal["add-file"].loading = true;
          //Parsing data
          data.file = document.getElementById('upload-file').files[0];
          console.log(data);
          var formData = new FormData();
          formData.append('file', data.file);
          formData.append('activityId', data.activityId.id);
          formData.append('fileName', data.fileName);
          //Sending data
          Files.addFile(formData).$promise.then(function(response){
            console.log(response);
            angular.element('#add-file').modal('hide');
            angular.element('.modal-backdrop').remove();
            $scope.modal["add-file"].loading = true;
            $state.reload();
            //Send success notification
            NotificationService.push({
              title: 'File uploaded',
              content: ['You have successfully uploaded the file ',data.fileName,'.'].join(''),
              link: null,
              type: NOTIFICATIONS_TYPES.success
            });
          }, function(error){
            console.log(error);
            $scope.modal["add-file"].loading = false;
          });
        }
      },
      title: 'Upload File',
      cancel: 'Cancel',
      submit: 'Upload',
      data: {},
      loading: false,
      refreshActivities: function(){
        if ($scope.modal.local.courseId){
          angular.forEach($scope.modal['add-file'].data.courses, function(course, key){
            // console.log($scope.modal.local.courseId);
            if (course.id === $scope.modal.local.courseId.id){
              $scope.modal['add-file'].data.activities = course.activities;
            }
          });
        }
      },
      this: function(target){
          $scope.modal["add-file"].loading = true;
          //Get dependencies
          $q.all([
            Courses.getAllUnpaged().$promise
          ]).then(function(response){
            //Modify course titles
            angular.forEach(response[0], function(value, key) {
               value.title = [Array(value.year+1).join('I'),value.semester,' - ',value.title].join('');
            });
            response[0].sort( function(a,b) {return (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0);} );
            //Append data
            $scope.modal["add-file"].data.courses = response[0];
            //Set default selected course if applicable
            $scope.modal.local.courseId = undefined;
            $scope.modal.local.activityId = undefined;
            if (target !== undefined && 'course' in target){
              $scope.modal.local.courseId = target.course;
              $scope.modal.local.activityId = target;
              $scope.modal.local.courseDisabled = true;
              $scope.modal.local.activityDisabled = true;
              $scope.modal["add-file"].refreshActivities();
            } else if (target !== undefined){
              $scope.modal.local.courseId = target;
              $scope.modal.local.courseDisabled = true;
              $scope.modal.local.activityDisabled = false;
              $scope.modal["add-file"].refreshActivities();
            } else{
              $scope.modal.local.courseDisabled = false;
              $scope.modal.local.activityDisabled = false;
            }
            $scope.modal["add-file"].loading = false;
          });
          //Got dependencies
          angular.element('#add-file').modal('show');
      }
    }
  };
  $scope.modal = $rootScope.modal;

}]);

app.constant('NOTIFICATIONS_TYPES', {
  default: 'default-notification',
  error: 'error-notification',
  success: 'success-notification'
});

app.factory("Activities", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "activities", {}, {
        getBasic: {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getAll: {
            url: config.apiEndpoint + "activities/join",
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getTypes: {
            url: config.apiEndpoint + "activities/types",
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getDetails: {
            url: config.apiEndpoint + "activities/details/:id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getByActivityId: {
            url: config.apiEndpoint + "activities/join/:activity_id",
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        addActivity: {
            url: config.apiEndpoint + "activities",
            method: "POST",
            headers: {
                'Content': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
    });
}]);

app.factory("Admins", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "admins", {}, {
        getAll: {
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "admins/:id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        add: {
            url: config.apiEndpoint + "admins",
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        }
    });
}]);

app.factory("Attendances", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "attendances", {}, {
        getAll: {
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "attendances/:activity_id/:student_id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getByActivityId: {
            url: config.apiEndpoint + "attendances/:activity_id",
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        }
    });
}]);

app.factory("Courses", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "courses", {}, {
        getAll: {
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getAllUnpaged: {
            url: config.apiEndpoint + "courses/all",
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "courses/:id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getLecturers: {
            url: config.apiEndpoint + "courses/:id/lecturers",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getStudents: {
            url: config.apiEndpoint + "courses/:id/students",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getActivities: {
            url: config.apiEndpoint + "courses/:id/activities",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        }
    });
}]);

app.factory("Files", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "files", {}, {
        getAll: {
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "files/file/:file_id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getByActivityId: {
            url: config.apiEndpoint + "files/:activity_id",
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getByActivityIdStudentId: {
            url: config.apiEndpoint + "files/:activity_id/:student_id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        addFile: {
            url: config.apiEndpoint + "storage/upload",
            method: "POST",
            headers: {
                "Content-Type": undefined,
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
    });
}]);

app.factory("Grades", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "grades", {}, {
        getAll: {
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "grades/:activity_id/:student_id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getByActivityId: {
            url: config.apiEndpoint + "grades/:activity_id",
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        }
    });
}]);

app.factory("Groups", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "groups", {}, {
        getAll: {
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "groups/:id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        }
    });
}]);

app.factory("Lecturers", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "lecturers", {}, {
        getAll: {
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "lecturers/:id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getCourses: {
            url: config.apiEndpoint + "lecturers/:id/courses",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        add: {
            url: config.apiEndpoint + "lecturers",
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        }
    });
}]);

app.factory("Storage", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "storage", {}, {
        retrieveFile: {
            url: config.apiEndpoint + "storage/download",
            method: "POST",
            headers: {
                'Accept': 'application/download',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        }
    });
}]);

app.factory("Students", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "students", {}, {
        getAll: {
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "students/:id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getAttendances: {
            url: config.apiEndpoint + "students/:id/attendances",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getGrades: {
            url: config.apiEndpoint + "students/:id/grades",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getFiles: {
            url: config.apiEndpoint + "students/:id/files",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getGroups: {
            url: config.apiEndpoint + "students/:id/groups",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getCourses: {
            url: config.apiEndpoint + "students/:id/courses",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        add: {
            url: config.apiEndpoint + "students",
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        addGroup: {
            url: config.apiEndpoint + "students/:id/groups",
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        }
    });
}]);

app.factory("Users", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "users", {}, {
        getAll: {
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        }
    });
}]);

app.constant("config", {
    development: true,
    apiEndpoint: "http://localhost:8080/api/",
    // apiEndpoint: "http://elixir.ionutrobert.com:8080/elixir-api/api/",
    icons: "material", //'material' or 'awesome'

    preloader: {
      artificialTime: 500 //milliseconds
    },

    notifications: {
      showDate: false,
      autoDismissTime: 8000, //milliseconds
    },

    authorizedRoles: {
      activities: {
        list: ['*'],
        sublist: ['*'],
        view: ['*'],
        create: ['ADMIN', 'LECTURER']
      },
      files: {
        create: ['STUDENT']
      },
      courses: {
        list: ['*'],
        view: ['*']
      },
      dashboard: ['*'],
      groups: {
        list: ['*'],
        view: ['ADMIN', 'LECTURER']
      },
      myAccount: ['*'],
      settings: ['*'],
      users: {
        list: ['ADMIN'],
        view: ['*']
      }
    }

})

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

app.controller('CoursesListController', ['$scope', '$rootScope', 'resolvedData', '$state', 'Courses', '$stateParams', function($scope, $rootScope, resolvedData, $state, Courses, $stateParams) {
    //Init
    $scope.title = 'Courses';
    $scope.courses = resolvedData.courses;
    $scope.pager = resolvedData.pager;

    $scope.pager.getPage = function(index){
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

app.controller('CoursesViewController', ['$scope', '$rootScope', 'resolvedData', '$stateParams', '$state', function($scope, $rootScope, resolvedData, $stateParams, $state) {
    //Init
    $scope.course = resolvedData.course;
    $scope.pager = resolvedData.pager ? resolvedData.pager : {};
    $scope.pager.getPage = function(index){
      $stateParams.page = index;
      $state.go('base.courses.view', $stateParams, {reload: true});
    };
    $scope.title = $scope.course.title;
    $scope.authUser = $rootScope.authUser.user;


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

app.config(function($stateProvider, config) {
    $stateProvider.state('base.dashboard', {
        url: '/dashboard',
        templateUrl: 'templates/dashboard.html',
        controller: 'DashboardController',
        data: {
          authorizedRoles: config.authorizedRoles.dashboard
        }
    });
});

app.controller('DashboardController', ['$scope','$rootScope','AuthService','config', function($scope, $rootScope, AuthService, config) {
    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Dashboard',
      'icon': null,
      'state': 'dashboard',
      'params': null
    };

    //Logic
    $scope.title = 'Dashboard';
    $scope.isAuthorized = AuthService.isAuthorized;
    $scope.authorizedRoles = config.authorizedRoles;
}]);

app.config(function($stateProvider) {
    $stateProvider.state('base.groups', {
      template: '<div ui-view></div>'
    });
});

// Group list
app.config(function($stateProvider, config) {
    $stateProvider.state('base.groups.list', {
        name: 'base.groups.list',
        url: '/groups?page&search',
        templateUrl: 'templates/groups-list.html',
        controller: 'GroupsListController',
        data: {
          authorizedRoles: config.authorizedRoles.groups.list
        },
        resolve: {
            resolvedData: ["Groups", "$http", "config", "$rootScope", "$q", "$stateParams", function(Groups, $http, config, $rootScope, $q, $stateParams) {
              search = $stateParams.search ? $stateParams.search : null;
              page = $stateParams.page ? parseInt($stateParams.page) : 0;
              return Groups.getAll({'page':page, 'search':search}).$promise.then(function(response){
                response.pager.pages = new Array(response.pager.totalPages);
                return {
                  groups: response.content,
                  pager: response.pager
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

app.controller('GroupsListController', ['$scope', '$rootScope', 'resolvedData', '$state', 'Groups', '$stateParams', function($scope, $rootScope, resolvedData, $state, Groups, $stateParams) {
    //Init
    $scope.title = 'Groups';
    $scope.groups = resolvedData.groups;
    $scope.pager = resolvedData.pager;

    console.log($scope.groups);

    $scope.pager.getPage = function(index){
      $stateParams.page = index;
      $state.go('base.groups.list', $stateParams, {reload: true});
    };

    // Search
    $scope.search = $rootScope.search;
    $scope.search.go = function(){
      $stateParams.page = 0;
      $stateParams.search = $scope.search.value;
      $state.go('base.groups.list', $stateParams, {reload: true});
    }
    document.getElementById("search-bar-input").addEventListener("keydown", function (e) {
      if (e.keyCode === 13) {
        $rootScope.search.go();
      }
    });

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Groups',
      'icon': null,
      'state': 'base.groups.list',
      'params': null
    };
    $rootScope.paths.length = 2;
}]);

//Group view
app.config(function($stateProvider, config) {
    $stateProvider.state('base.groups.view', {
        name: 'base.groups.view',
        url: '/groups/:id',
        templateUrl: 'templates/groups-view.html',
        controller: 'GroupsViewController',
        data: {
          authorizedRoles: config.authorizedRoles.groups.view
        },
        resolve: {
            resolvedData: ["Groups", "$stateParams", "$rootScope", "$q", function(Groups, $stateParams, $rootScope, $q) {
              return Groups.getById({
                id: $stateParams.id
              }).$promise.then(function(response){
                return {
                  group: response
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

app.controller('GroupsViewController', ['$scope', '$rootScope', 'resolvedData', function($scope, $rootScope, resolvedData) {
    //Init
    $scope.group = resolvedData.group;
    $scope.title = "Grupa "+$scope.group.name;

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Groups',
      'icon': null,
      'state': 'base.groups.list',
      'params': null
    };
    $rootScope.paths[2] = {
      'title': $scope.group.name,
      'icon': null,
      'state': 'base.groups.view',
      'params': {
        id: $scope.group.id
      }
    };
    $rootScope.paths.length = 3;
}]);

app.config(function($stateProvider) {
    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'LoginController',
    });
});

app.controller('LoginController', ['$scope', '$q','$state', '$timeout', 'AuthService', 'config', '$rootScope', 'NOTIFICATIONS_TYPES', 'NotificationService', function($scope, $q, $state, $timeout, AuthService, config, $rootScope, NOTIFICATIONS_TYPES, NotificationService) {
    $scope.title = 'Login';
    $scope.form = {
      loading: false,
      email: null,
      password: null,
      errors : null,
      submit: function(){
        $scope.form.loading = true;
        $scope.form.errors = null;
        //Artificial delay
        $timeout(function(){
          AuthService.login({
            "email": $scope.form.email,
            "password": $scope.form.password
          }).then(function(response){
            // NotificationService.push({
            //   title: 'Logged in',
            //   content: 'You have successfully logged in your account.',
            //   link: null,
            //   type: NOTIFICATIONS_TYPES.success
            // });
          }, function(response){
            $scope.form.loading = false;
            if (response == null){
              NotificationService.push({
                title: 'Server connection failed',
                content: 'We couldn\'t connect to the server. Try again later.',
                link: null,
                type: NOTIFICATIONS_TYPES.error
              });
            } else{
              $scope.form.errors = response.errors ? response.errors : null;
            }
          });
        }, config.preloader.artificialTime);
      }
    };

    //Notifications wrapper
    $scope.notifications = $rootScope.notifications;
    //Notifications listener
    $scope.$on('not-authenticated', function (event, data) {
      NotificationService.push({
        title: 'Not authorized',
        content: 'You are not allowed to view the requested resource.',
        link: null,
        type: NOTIFICATIONS_TYPES.error
      });
    });

}]);

app.config(function($stateProvider, config) {
    $stateProvider.state('base.settings', {
        url: '/settings',
        templateUrl: 'templates/settings.html',
        controller: 'SettingsController',
        data: {
          authorizedRoles: config.authorizedRoles.settings
        },
        resolve: {
            resolvedData: ["Students", "Lecturers", "Admins", "$rootScope", "$q", function(Students, Lecturers, Admins, $rootScope, $q) {
              var resource;
              var type = $rootScope.authUser.user.type;
              switch(type){
                case 'student':
                  resource = Students;
                  break;
                case 'lecturer':
                  resource = Lecturers;
                  break;
                case 'admin':
                  resource = Admins;
                  break;
              }
              return resource.getById({
                id: $rootScope.authUser.user.id
              }).$promise.then(function(response){
                response.hasGroups = type == 'students' ? true : false;
                response.hasCourses = type == 'students' || type == 'lecturers' ? true : false;
                response.hasAttendances = type == 'students' ? true : false;
                response.hasGrades = type == 'students' ? true : false;
                response.hasFiles = type == 'students' ? true : false;
                response.type = type;
                return {
                  user: response
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


app.controller('SettingsController', ['$scope', '$rootScope', 'resolvedData', function($scope, $rootScope, resolvedData) {
    //Init
    $scope.title = 'Settings';
    $scope.user = resolvedData.user;
    console.log($scope.user);
    $scope.user.tag = 'tag-'+$scope.user.type;

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Settings',
      'icon': null,
      'state': 'base.settings',
      'params': null
    };
    $rootScope.paths.length = 2;

    //Details
    $scope.table = {
      title: 'User details'
    };
    $scope.table.detailRows = [{
        title : 'First Name',
        value : $scope.user.firstName,
        customClass : 'td-bold'
      },{
        title : 'Last Name',
        value : $scope.user.lastName,
        customClass : 'td-bold'
      },{
        title: 'Type',
        value : $scope.user.type,
        customClass : 'tag '+$scope.user.tag
      },{
        title: 'Email',
        value: $scope.user.email,
        customClass: 'td-blue'
      }
    ];
    $scope.table.settingRows = [{
        title : 'Language',
        value : 'unavailable',
        customClass : 'td-disabled'
      },{
        title : 'Support',
        value : 'unavailable',
        customClass : 'td-disabled'
      },{
        title : 'Change Password',
        value : 'unavailable',
        customClass : 'td-disabled'
      }
    ];
}]);

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
    $scope.search.go = function(){
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

app.directive('preloader', function() {
  return {
    restrict: 'E',
    replace: true,
    template: '<section class="preloader"><section class="p-boxes-wrapper"><figure class="p-box"></figure><figure class="p-box"></figure><figure class="p-box"></figure></section><section class="logo-wrapper hide"><figure class="logo"></figure></section></section>',
  };
});

app.factory('AuthService', ['$http', '$rootScope', '$state', '$cookies', '$q', 'config', function ($http, $rootScope, $state, $cookies, $q, config) {
  var authService = {};

  authService.login = function (credentials) {
    var deferred = $q.defer();
    $http
      .post(config.apiEndpoint+'login', credentials)
      .then(function (response){
        $cookies.putObject('authUser', response.data, {expires: new Date().addHours(2)});
        $rootScope.authUser = $cookies.getObject('authUser');
        $state.go('base.dashboard');
        deferred.resolve({
          'user': $rootScope.authUser
        })
      }, function(response){
        deferred.reject(response.data);
        return response;
      });
    return deferred.promise;
  };

  authService.logout = function(){
    $cookies.remove('authUser');
    $rootScope.authUser.token = null;
    $rootScope.authUser.user = null;
    $state.go('login');
  }

  authService.getToken = function(){
    return $rootScope.authUser.token;
  }

  authService.isAuthenticated = function () {
    return $cookies.getObject('authUser')!=null;
  };

  authService.isAuthorized = function (authorizedRoles) {
    if (!authService.isAuthenticated()){
      return false;
    }
    if (!angular.isArray(authorizedRoles)) {
      authorizedRoles = [authorizedRoles];
    }
    role = $rootScope.authUser.user.type.toUpperCase();
    // return authService.isAuthenticated();
    return (authorizedRoles.indexOf(role) !== -1 || authorizedRoles.indexOf("*") !== - 1);
  };

  authService.hasRole = function(role){
    role = role.toUpperCase();
    return authService.isAuthenticated() && (role === $rootScope.authUser.user.type.toUpperCase() || role === '*');
  }

  return authService;
}])


app.factory('NotificationService', ['$http', '$rootScope', '$state', '$cookies', '$q', 'config', '$timeout', function ($http, $rootScope, $state, $cookies, $q, config, $timeout) {
  var notificationService = {};

  notificationService.push = function (notification) {
    var index = $rootScope.notifications.append(notification);
    //TODO remove doesn't work because the index is changing if a previous one is removed (try remove by unique key)
    $timeout(function(){
      $rootScope.notifications.dismiss();
    }, config.notifications.autoDismissTime);
  };

  notificationService.flush = function(){
    $rootScope.notifications.values = [];
  }

  return notificationService;
}])
