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
    'state': 'dashboard',
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

  //Notifications wrapper
  $rootScope.notifications = {
    active: [],
    append: function(notification){
      $rootScope.notifications.active.push({
        title: notification.title,
        content: notification.content,
        link: notification.link,
        type: notification.type
      });
      return $rootScope.notifications.active.length-1;
    },
    dismiss: function(index){
      $rootScope.notifications.active.splice(index,1);
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

app.controller('BaseController', ['$scope', '$rootScope', 'AuthService', '$state', '$timeout', 'config', 'NOTIFICATIONS_TYPES', 'NotificationService', function($scope, $rootScope, AuthService, $state, $timeout, config, NOTIFICATIONS_TYPES, NotificationService) {
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
    email: $rootScope.authUser.user.email
  }

  $scope.modal = {
    confirm: {
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
      this: function(callback){
        angular.element('#confirm-modal').modal('show');
        $scope.modal.confirm.action.value = callback;
      }
    }
  };

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
        $scope.loading = true;
      }
    }
  });
  $rootScope.$on('$stateChangeSuccess', function(event, toState){
    $scope.loading = false;
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

}]);

app.constant('NOTIFICATIONS_TYPES', {
  default: 'default-notification',
  error: 'error-notification',
  success: 'success-notification'
});

//Sample notification
/*
{
  title: 'Notification 1',
  type: 'default-notification',
  content: 'Where the f**k is all this text coming from? Someone damaged the content pipe or smth? Stop it now pls.',
  link: {
    text: 'Read more',
    href: '#'
  }
}
*/
