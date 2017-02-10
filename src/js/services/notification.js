app.factory('NotificationService', ['$http', '$rootScope', '$state', '$cookies', '$q', 'config', '$timeout', function ($http, $rootScope, $state, $cookies, $q, config, $timeout) {
  var notificationService = {};

  notificationService.push = function (notification) {
    var index = $rootScope.notifications.append(notification);
    $timeout(function(){
      $rootScope.notifications.dismiss(index);
    }, config.notifications.autoDismissTime);
  };

  notificationService.flush = function(){
    $rootScope.notifications.values = [];
  }

  return notificationService;
}])
