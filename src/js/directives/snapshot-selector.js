app.directive('snapshotSelector', ['languageTranslator', '$rootScope', function(languageTranslator, $rootScope) {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/templates/elements/snapshot-selector.html',
    scope: {
      snapshots: '=',
      snapshotService: '='
    },
    link: function (scope, element, attrs) {
      if (typeof scope.snapshots != 'undefined'){
        for (var i=0; i<scope.snapshots.length;i+=1){
          scope.snapshots[i].label = [scope.snapshots[i].startYear,"-",scope.snapshots[i].endYear,languageTranslator.tables.semester[$rootScope.language],scope.snapshots[i].semester].join(" ");
        }
        scope.selectedSnapshot = scope.snapshotService.getSnapshot() !== null && typeof scope.snapshotService.getSnapshot() != 'undefined' ? scope.snapshotService.getSnapshot() : scope.snapshots[scope.snapshots.length-1];
      } else{
        scope.snapshots = [];
      }
    }
  };
}]);
