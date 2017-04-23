app.config(function($stateProvider, config) {
    $stateProvider.state('base.settings', {
        url: '/settings',
        templateUrl: 'templates/settings.html',
        controller: 'SettingsController',
        data: {
          authorizedRoles: config.authorizedRoles.settings
        },
        resolve: {
            resolvedData: ["Students", "Lecturers", "Admins", "$rootScope", "$q", function(Students, Lecturers, Admins, $rootScope, $q) {
              var resource;
              var type = $rootScope.authUser.user.type;
              switch(type){
                case 'student':
                  resource = Students;
                  break;
                case 'lecturer':
                  resource = Lecturers;
                  break;
                case 'admin':
                  resource = Admins;
                  break;
              }
              return resource.getById({
                id: $rootScope.authUser.user.id
              }).$promise.then(function(response){
                response.hasGroups = type == 'students' ? true : false;
                response.hasCourses = type == 'students' || type == 'lecturers' ? true : false;
                response.hasAttendances = type == 'students' ? true : false;
                response.hasGrades = type == 'students' ? true : false;
                response.hasFiles = type == 'students' ? true : false;
                response.type = type;
                return {
                  user: response
                };
              }, function(response){
                console.log(response);
                $rootScope.$broadcast("not-authorized");
                return $q.reject("Rejection message!");
              });
            }]
        }
    });
});


app.controller('SettingsController', ['$scope', '$rootScope', 'resolvedData', 'languageTranslator', function($scope, $rootScope, resolvedData, languageTranslator) {
    //Init
    $scope.user = resolvedData.user;
    console.log($scope.user);
    $scope.user.tag = 'tag-'+$scope.user.type;

    $scope.setData = function(){
      $scope.title = languageTranslator.pages.settings.title[$rootScope.language];
      $scope.languageLabel = languageTranslator.pages.settings.languageLabel[$rootScope.language];
      //Add path to breadcrums list
      $rootScope.paths[1] = {
        'title': languageTranslator.pages.settings.title[$rootScope.language],
        'icon': null,
        'state': 'base.settings',
        'params': null
      };
      $rootScope.paths.length = 2;
      $scope.buttonLabels = {
        changeDetails: languageTranslator.pages.settings.buttons.changeDetails[$rootScope.language]
      }

      //Details
      $scope.table = {};
      $scope.table.detailRowsTitle = languageTranslator.pages.settings.table.detailsRowsTitle[$rootScope.language];
      $scope.table.detailRows = [{
          title : languageTranslator.pages.settings.table.detailsRows.firstName[$rootScope.language],
          value : $scope.user.firstName,
          customClass : 'td-bold'
        },{
          title : languageTranslator.pages.settings.table.detailsRows.lastName[$rootScope.language],
          value : $scope.user.lastName,
          customClass : 'td-bold'
        },{
          title: languageTranslator.pages.settings.table.detailsRows.type[$rootScope.language],
          value : $scope.user.type,
          customClass : 'tag '+$scope.user.tag
        },{
          title: languageTranslator.pages.settings.table.detailsRows.email[$rootScope.language],
          value: $scope.user.email,
          customClass: 'td-blue'
        }
      ];
      $scope.table.settingRowsTitle = languageTranslator.pages.settings.title[$rootScope.language];
      $scope.table.settingRows = [{
          title : languageTranslator.pages.settings.languageLabel[$rootScope.language],
          value : languageTranslator.pages.settings.errors.unavailable[$rootScope.language],
          customClass : 'td-disabled'
        },{
          title : languageTranslator.pages.settings.table.settingRows.support[$rootScope.language],
          value : languageTranslator.pages.settings.errors.unavailable[$rootScope.language],
          customClass : 'td-disabled'
        },{
          title : languageTranslator.pages.settings.table.settingRows.changePassword[$rootScope.language],
          value : languageTranslator.pages.settings.errors.unavailable[$rootScope.language],
          customClass : 'td-disabled'
        }
      ];
    };
    $scope.setData();

    //language
    $scope.languages = languageTranslator.languages;
    $scope.checkLanguage = function(language){
      if (language === $rootScope.language){
        return true;
      } else{
        return false;
      }
    }
    $scope.languageToggle = function(lang){
      $rootScope.languageToggle(lang);
      $scope.setData();
    };

}]);
