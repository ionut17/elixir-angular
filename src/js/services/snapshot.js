app.factory('SnapshotService', ['$http', '$rootScope', '$state', '$cookies', '$q', 'config', function ($http, $rootScope, $state, $cookies, $q, config) {
  var snapshotService = {};

  var snapshot = null;

  snapshotService.getSnapshot = function(){
    return this.snapshot;
  }

  snapshotService.setSnapshot = function(target){
    this.snapshot = target;
    $http.defaults.headers.common.Snapshot = this.snapshot.id;
  }

  snapshotService.getAllSnapshots = function(){
    return $http.get(config.apiEndpoint+'snapshots').then(function (response) {
      return response.data;
    });
  }

  return snapshotService;
}])
