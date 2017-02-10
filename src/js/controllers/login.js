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
            NotificationService.push({
              title: 'Logged in',
              content: 'You have successfully logged in your account.',
              link: null,
              type: NOTIFICATIONS_TYPES.success
            });
          }, function(response){
            $scope.form.loading = false;
            $scope.form.errors = response.errors;
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
