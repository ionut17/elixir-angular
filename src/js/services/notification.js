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
