app.config(function($stateProvider, config) {
    $stateProvider.state('base.settings', {
        url: '/settings',
        templateUrl: 'templates/settings.html',
        controller: 'SettingsController',
        data: {
          authorizedRoles: config.authorizedRoles.settings
        },
        resolve: {
            resolvedData: ["Students", "Lecturers", "Admins", "$rootScope", function(Students, Lecturers, Admins, $rootScope) {
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
              });
            }]
        }
    });
});


app.controller('SettingsController', ['$scope', '$rootScope', 'resolvedData', function($scope, $rootScope, resolvedData) {
    //Init
    $scope.title = 'Settings';
    $scope.user = resolvedData.user;
    console.log($scope.user);
    $scope.user.tag = 'tag-'+$scope.user.type;

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Settings',
      'icon': null,
      'state': 'settings',
      'params': null
    };
    $rootScope.paths.length = 2;

    //Details
    $scope.table = {
      title: 'User details'
    };
    $scope.table.detailRows = [{
        title : 'First Name',
        value : $scope.user.firstName,
        customClass : 'td-bold'
      },{
        title : 'Last Name',
        value : $scope.user.lastName,
        customClass : 'td-bold'
      },{
        title: 'Type',
        value : $scope.user.type,
        customClass : 'tag '+$scope.user.tag
      },{
        title: 'Email',
        value: $scope.user.email,
        customClass: 'td-blue'
      }
    ];
    $scope.table.settingRows = [{
        title : 'Language',
        value : 'unavailable',
        customClass : 'td-disabled'
      },{
        title : 'Support',
        value : 'unavailable',
        customClass : 'td-disabled'
      },{
        title : 'Change Password',
        value : 'unavailable',
        customClass : 'td-disabled'
      }
    ];
}]);
