app.config(function($stateProvider, config) {
    $stateProvider.state('base.import', {
        url: '/import',
        templateUrl: 'templates/import.html',
        controller: 'ImportController',
        data: {
          authorizedRoles: config.authorizedRoles.import
        }
    });
});


app.controller('ImportController', ['$scope', '$rootScope', 'languageTranslator', function($scope, $rootScope, languageTranslator) {
    //Init
    $scope.title = languageTranslator.pages.import.title[$rootScope.language];
    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': languageTranslator.pages.import.title[$rootScope.language],
      'icon': null,
      'state': 'base.import',
      'params': null
    };
    $rootScope.paths.length = 2;

    //Labels
    $scope.labels = {
      placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders),
      table: $rootScope.getTranslatedObject(languageTranslator.tables),
      errors: $rootScope.getTranslatedObject(languageTranslator.errors),
      importEntities: languageTranslator.pages.import.importEntities[$rootScope.language],
      importRelations: languageTranslator.pages.import.importRelations[$rootScope.language],
      importData: languageTranslator.pages.import.importData[$rootScope.language]
    }

}]);
