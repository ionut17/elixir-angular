app.config(function($stateProvider) {
    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'LoginController',
    });
});

app.controller('LoginController', ['$scope', '$q','$state', '$timeout', 'AuthService', 'config', '$rootScope', 'NOTIFICATIONS_TYPES', 'NotificationService', 'languageTranslator',
      function($scope, $q, $state, $timeout, AuthService, config, $rootScope, NOTIFICATIONS_TYPES, NotificationService, languageTranslator) {
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
                title: languageTranslator.pages.login.notificationError.title[$rootScope.language],
                content: languageTranslator.pages.login.notificationError.content[$rootScope.language],
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

    $scope.labels = {
      login: $rootScope.getTranslatedObject(languageTranslator.pages.login),
      table: $rootScope.getTranslatedObject(languageTranslator.tables),
      errors: $rootScope.getTranslatedObject(languageTranslator.errors),
      placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders)
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
