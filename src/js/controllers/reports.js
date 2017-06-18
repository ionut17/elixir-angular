app.config(function($stateProvider, config) {
    $stateProvider.state('base.reports', {
        url: '/reports?course_id&type',
        templateUrl: 'templates/reports.html',
        controller: 'ReportsController',
        data: {
          authorizedRoles: config.authorizedRoles.import
        },
        resolve: {
            resolvedData: ["Courses", "$http", "config", "$rootScope", "$q", "$stateParams", function(Courses, $http, config, $rootScope, $q, $stateParams) {
              return Courses.getAllUnpaged().$promise.then(function(response){
                //Modify course titles
                angular.forEach(response, function(value, key) {
                   value.title = [Array(value.year+1).join('I'),value.semester,' - ',value.title].join('');
                });
                response.sort( function(a,b) {return (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0);} );
                return {
                  courses: response
                }
              }, function(response){
                console.log(response);
                $rootScope.$broadcast("not-authorized");
                return $q.reject("Rejection message!");
              });
            }]
        }
    });
});


app.controller('ReportsController', ['$scope', '$q', '$rootScope', 'languageTranslator', 'resolvedData', 'Courses', 'Attendances', 'Grades', 'Files', '$state', '$stateParams', 'Groups', '$state',
    function($scope, $q, $rootScope, languageTranslator, resolvedData, Courses, Attendances, Grades, Files, $state, $stateParams, Groups, $state) {
    //Init
    $scope.title = languageTranslator.pages.reports.title[$rootScope.language];
    $scope.courses = resolvedData.courses;
    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': languageTranslator.pages.reports.title[$rootScope.language],
      'icon': null,
      'state': 'base.report',
      'params': null
    };
    $rootScope.paths.length = 2;

    //Labels
    $scope.labels = {
      placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders),
      buttons: $rootScope.getTranslatedObject(languageTranslator.buttons),
      table: $rootScope.getTranslatedObject(languageTranslator.tables),
      errors: $rootScope.getTranslatedObject(languageTranslator.errors),
      reportTarget: languageTranslator.tables.course[$rootScope.language],
      reportType: ''
    };

    //course
    $scope.selectedCourseObj = typeof $stateParams.course_id != 'undefined' ? {'id':parseFloat($stateParams.course_id)} : '';
    $scope.selectedCourse = typeof $stateParams.course_id != 'undefined' ? parseFloat($stateParams.course_id) : '';
    $scope.selectType = typeof $stateParams.type != 'undefined' ? $stateParams.type : '';
    $scope.selectedType = typeof $stateParams.type != 'undefined' ? $stateParams.type : '';
    $scope.canGenerate = false;
    $scope.refreshGenerateButton = function(){
      $scope.canGenerate = $scope.selectedCourseObj != '' && $scope.selectType != '';
    }
    //Report
    $scope.report = {
      totals: {}
    }
    $scope.generateReport = function(){
      $state.go('base.reports',{course_id: $scope.selectedCourseObj.id, type: $scope.selectType}, {reload:true});
    }
    $scope.loadReport = function(){
      $scope.report = {
        totals: {}
      };
      //Make query
      var resource;
      switch ($scope.selectedType){
        case 'attendances':
          resource = Attendances;
          break;
        case 'grades':
          resource = Grades;
          break;
        case 'files':
          resource = Files;
          break;
      };
      $q.all([
        resource.getByCourseId({'course_id':$scope.selectedCourse}).$promise,
        Courses.getById({'id':$scope.selectedCourse}).$promise,
        Groups.getAllUnpaged().$promise,
      ]).then(function(response){
        $scope.report[$scope.selectedType] = response[0];
        $scope.report.groups = response[2];
        $scope.report.activities = response[1].activities;
        $scope.report.students = response[1].students;
        $scope.report.students.sort( function(a,b) {return (a.lastName> b.lastName) ? 1 : ((b.lastName > a.lastName) ? -1 : 0);} );
        //Adding checked/unchecked status (for group filtering)
        angular.forEach($scope.report.students, function(student, key){
          student.visible = true;
        });
        angular.forEach($scope.report.groups, function(group, key){
          group.name = [group.year,group.name].join('-');
        });
        $scope.report.groups.sort( function(a,b) {return (a.name> b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} );
        //Setting labels
        $scope.labels.reportTarget = response[1].title;
        $scope.labels.reportType = languageTranslator.tables[$scope.selectedType][$rootScope.language];
        //Generate matrix
        $scope.report.matrix = {};
        for (var studentIndex = 0; studentIndex < $scope.report.students.length; studentIndex += 1){
          $scope.report.matrix[$scope.report.students[studentIndex].id] = {};
          for (var activityIndex = 0; activityIndex < $scope.report.activities.length; activityIndex += 1){
            $scope.report.matrix[$scope.report.students[studentIndex].id][$scope.report.activities[activityIndex].id] = {text: '', changed: ''};
          }
        }
        //Mapping values
        for (var activityIndex = 0; activityIndex < $scope.report[$scope.selectedType].length; activityIndex += 1){
          var studentId = $scope.report[$scope.selectedType][activityIndex].student.id;
          var activityId = $scope.report[$scope.selectedType][activityIndex].activity.id;
          var value = {
            text: undefined,
            data: undefined,
            changed: undefined
          };
          switch ($scope.selectedType){
            case 'attendances':
              value.text = languageTranslator.tables.attended[$rootScope.language];
              break;
            case 'grades':
              value.text = parseFloat($scope.report[$scope.selectedType][activityIndex].value);
              break;
            case 'files':
              value.text = 'F';
              value.data = $scope.report[$scope.selectedType][activityIndex].id;
              break;
          };
          value.changed = value.text;
          $scope.report.matrix[studentId][activityId] = value;
        }
        console.log($scope.report);
      });
    };
    if (typeof $stateParams.course_id != 'undefined' && typeof $stateParams.type != 'undefined'){
      $scope.loadReport();
      $scope.canGenerate = true;
    }
    $scope.reportValueOf = function(studentId, activityId){
      return $scope.report.matrix[studentId][activityId].text;
    };
    $scope.reportDataOf = function(studentId, activityId){
      return $scope.report.matrix[studentId][activityId].data;
    }
    $scope.getTotalOf = function(studentId){
      var total = 0;
      switch($scope.selectedType){
        case 'attendances':
        case 'files':
          for (var key in $scope.report.matrix[studentId]){
            if ($scope.report.matrix[studentId][key].text !== '')
              total += 1;
          }
          break;
        case 'grades':
          for (var key in $scope.report.matrix[studentId]){
            if ($scope.report.matrix[studentId][key].text !== '')
              total += parseFloat($scope.report.matrix[studentId][key].text);
          }
          break;
        default:
          break;
      }
      return total;
    };
    //Go to activity
    $scope.goToActivity = function(studentId, activityId){
      if ($scope.edit.status && $scope.selectedType=='attendances'){
        $scope.report.matrix[studentId][activityId].changed = $scope.report.matrix[studentId][activityId].changed != '' ? '' : 'P';
      } else if ($scope.reportValueOf(studentId,activityId) != '' && !$scope.edit.status){
        var params = {
          type: $scope.selectedType,
          course_id: $scope.selectedCourse,
          activity_id: activityId,
          user_id: studentId,
        };
        params.file_id = $scope.selectedType === 'files' ? $scope.reportDataOf(studentId, activityId) : undefined;
        $scope.modal['view-activity'].this(params);
        // params.file_id = activity.id !== undefined ? activity.id : params.file_id;
        // $state.go('base.activities.view', params, {reload: true});
      }
    };

    //Edit mode
    $scope.edit = {
      status: false,
      toggle: function(){
        $scope.edit.status = !$scope.edit.status;
      },
      save: function(){
        // Get resource
        var resource, caller, newField;
        switch ($scope.selectedType){
          case 'attendances':
            resource = Attendances;
            caller = Attendances.addAttendances;
            newField = 'studentIds';
            break;
          case 'grades':
            resource = Grades;
            caller = Grades.addGrades;
            newField = 'studentsGrades';
            break;
          case 'files':
            resource =  Files;
            // caller = Files;
            caller = null;
            break;
        };
        var data;
        //Parse
        var currentStudent, currentActivity, data;
        for (activity in $scope.report.activities){
          currentActivity = $scope.report.activities[activity];
          data = {
            'activityId': currentActivity.id,
          };
          data[newField] = [];
          for (student in $scope.report.students){
            currentStudent = $scope.report.students[student];
            if ($scope.report.matrix[currentStudent.id][currentActivity.id].text != $scope.report.matrix[currentStudent.id][currentActivity.id].changed){
              if ($scope.report.matrix[currentStudent.id][currentActivity.id].changed !== ''){
                //If added
                switch ($scope.selectedType){
                  case 'attendances':
                    data[newField].push(currentStudent.id);
                    $scope.report.matrix[currentStudent.id][currentActivity.id].text = languageTranslator.tables.attended[$rootScope.language];
                    break;
                  case 'grades':
                    data[newField].push({'studentId': currentStudent.id, 'grade': parseFloat($scope.report.matrix[currentStudent.id][currentActivity.id].changed)});
                    $scope.report.matrix[currentStudent.id][currentActivity.id].text = parseFloat($scope.report.matrix[currentStudent.id][currentActivity.id].changed);
                    break;
                };
              } else{
                $scope.report.matrix[currentStudent.id][currentActivity.id].text = '';
                //If removed
                resource.delete({
                  activity_id: currentActivity.id,
                  student_id: currentStudent.id
                }).$promise.then(function(response){}, function(error){});
              }
            }
          }
          caller(data).$promise.then(function(response){}, function(error){});
          $scope.edit.status = false;
        }
        // $state.reload();
        //Manual reload
      }
    };

    //Export to PDF
    $scope.export = function(type){
      var name = [$scope.labels.reportTarget, $scope.labels.reportType, new Date().toLocaleString()].join('_');
      switch (type){
        case 'pdf':
          var pdf = new jsPDF('l', 'pt', 'letter');
          // source can be HTML-formatted string, or a reference
          // to an actual DOM element from which the text will be scraped.
          source = $('#report')[0];
          var res = pdf.autoTableHtmlToJson(source);
          pdf.autoTable(res.columns, res.data);
          pdf.save(name+".pdf");
          break;
        case 'csv':
          var data = ['Student'].concat($scope.report.activities.map(function(activity){ return activity.name})).concat(['Total']).join(',');
          var currentLine = [];
          var currentString = '';
          for (var studentIndex = 0; studentIndex < $scope.report.students.length; studentIndex += 1){
            currentLine = [[$scope.report.students[studentIndex].firstName,$scope.report.students[studentIndex].lastName].join(" ")];
            for (var activityIndex = 0; activityIndex < $scope.report.activities.length; activityIndex += 1){
              currentLine.push($scope.report.matrix[$scope.report.students[studentIndex].id][$scope.report.activities[activityIndex].id].text);
            }
            currentLine.push($scope.getTotalOf($scope.report.students[studentIndex].id));
            currentString = currentLine.join(',');
            data = [data,currentString].join('\n');
          };
          var csvData = "data:text/csv;charset=utf-8,"+data;
          var encodedUri = encodeURI(csvData);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", [name,".csv"].join(''));
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);
          break;
        default:
          break;
      }
    };
    $scope.filterStudents = function(){
      $scope.loading = true;
      var paramGroup = $scope.selectedGroup;
      angular.forEach($scope.report.students, function(student, key){
        if (typeof paramGroup !== 'undefined' && paramGroup !== null){
          student.visible = false;
          angular.forEach(student.groups, function(group, gKey){
            if (group.id === paramGroup){
              student.visible = true;
            }
          });
        } else{
          student.visible = true;
        }
      });
      $scope.loading = false;
    };

}]);
