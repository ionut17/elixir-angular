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
