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
    console.log($cookies.getObject('authUser'));
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
