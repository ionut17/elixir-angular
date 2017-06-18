var app = angular.module('app', ['ui.router', 'ngResource', 'ngCookies']);

app.config(function($urlRouterProvider, $locationProvider) {

    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/login');

    //Extra functions
    String.prototype.capitalizeFirstLetter = function() {
      return this.charAt(0).toUpperCase() + this.slice(1);
    }
    Date.prototype.addHours = function(h) {
      this.setTime(this.getTime() + (h*60*60*1000));
      return this;
    }
    Date.prototype.addDays = function(d) {
      this.setTime(this.getTime() + (d*24*60*60*1000));
      return this;
    }

});

app.run(function($rootScope, $timeout, $state, $cookies, config, languageTranslator, SnapshotService) {
  $rootScope.$state = $state;
  $rootScope.loading = false;
  var cookieAuthUser = $cookies.getObject('authUser');
  if (cookieAuthUser){
    $rootScope.authUser = $cookies.getObject('authUser');
  } else{
    $rootScope.authUser = {
      token: null,
      user: {
        firstName: null,
        lastName: null,
        email: null
      }
    }
  }

  //SnapshotService
  $rootScope.snapshotService = SnapshotService;
  SnapshotService.getAllSnapshots().then(function(response){
    $rootScope.snapshots = response;
  }, function(response){
    $rootScope.snapshots = [];
  });
  //End SnapshotService

  $rootScope.menuVisible = true;

  var language = $cookies.getObject('language');
  if (language === undefined || language === null){
      $cookies.putObject('language', languageTranslator.languages[0], {expires: new Date().addDays(30)});
  }
  if (languageTranslator.languages.indexOf(language) > -1){
    $rootScope.language = language;
  } else{
    $rootScope.language = languageTranslator.languages[0];
  }
  $rootScope.languageToggle = function(language){
    if (language !== undefined && languageTranslator.languages.indexOf(language) > -1){
      $rootScope.language = language;
      $cookies.putObject('language', language);
      console.log('Current language:', $rootScope.language);
    } else{
      $rootScope.language = languageTranslator.languages[0];
    }
  }
  $rootScope.getTranslatedObject = function(param){
    var object = {};
    angular.copy(param, object);
    for (var key in object){
      object[key] = object[key][$rootScope.language];
    }
    return object;
  }

  $rootScope.paths = [{
    'title': '',
    'icon': 'dashboard',
    'state': 'base.dashboard',
    'params': null
  }];
  $rootScope.getPath = function(state, paramObj){
    return $state.href(state, paramObj);
  }

  $rootScope.icons = {
    'type' : config.icons,
    'showAwesome' : config.icons == 'awesome',
    'showMaterial' : config.icons != 'awesome'
  }

  $rootScope.search = {
    value: null,
    go: function(){
      $scope.refresh();
    },
    clear: function(){
      this.value = null;
      this.go();
    }
  };

  if (!config.development){
    $rootScope.$on('$stateChangeSuccess', function(event, toState){
      var stateName = $state.current.name;
      if (stateName.substring(0,5) === 'base.'){
        stateName = stateName.substring(5);
      }
      // console.log(stateName);
      if ($rootScope.authUser.user){
        mixpanel.identify($rootScope.authUser.user.type+$rootScope.authUser.user.id);
        mixpanel.people.set({
            "$first_name": $rootScope.authUser.user.firstName,
            "$last_name": $rootScope.authUser.user.lastName,
            "$created": new Date().getDate(),
            "$email": $rootScope.authUser.user.email
        });
      }
      mixpanel.track("Page Visit", {
        "Page": stateName
      });
    });
  }

  //Notifications wrapper
  $rootScope.notifications = {
    active: [],
    showDate: config.notifications.showDate,
    append: function(notification){
      var dateObj = new Date();
      $rootScope.notifications.active.push({
        date: [dateObj.getHours(),dateObj.getMinutes()].join(':'),
        title: notification.title,
        content: notification.content,
        link: notification.link,
        type: notification.type
      });
      return $rootScope.notifications.active.length-1;
    },
    dismiss: function(index){
      if (index){
        $rootScope.notifications.active.splice(index,1);
      } else{
        $rootScope.notifications.active.splice(0,1);
      }
    }
  };

});

//Base.js
app.config(function($stateProvider) {
  $stateProvider.state('base', {
    templateUrl: 'templates/base.html',
    controller: 'BaseController',
  });
});

app.controller('BaseController', ['$scope', '$rootScope', '$q', 'AuthService', '$state', '$timeout', 'config', 'NOTIFICATIONS_TYPES', 'NotificationService', 'languageTranslator', 'Students', 'Lecturers', 'Admins', 'Courses', 'Groups', 'Activities', 'Attendances', 'Grades', 'Files', 'Storage',
      function($scope, $rootScope, $q, AuthService, $state, $timeout, config, NOTIFICATIONS_TYPES, NotificationService, languageTranslator, Students, Lecturers, Admins, Courses, Groups, Activities, Attendances, Grades, Files, Storage) {
  $scope.logout = function(){
    AuthService.logout();
    NotificationService.push({
      title: 'Logged out',
      content: 'You haved logged out of your account.',
      link: null,
      type: NOTIFICATIONS_TYPES.default
    });
  }
  $scope.isAuthorized = AuthService.isAuthorized;
  $scope.authorizedRoles = config.authorizedRoles;

  $scope.loading = false;
  $scope.authUser = {
    username: $rootScope.authUser.user.firstName+' '+$rootScope.authUser.user.lastName,
    email: $rootScope.authUser.user.email,
    type: $rootScope.authUser.user.type,
    group: $rootScope.authUser.user.type+'s',
    id: $rootScope.authUser.user.id,
    class: 'tag-'+$rootScope.authUser.user.type
  }

  $scope.setMenu = function(isVisible){
    var body = angular.element('.body-container');
    if (isVisible){
      body.removeClass('menu-off');
      $rootScope.menuVisible = true;
    } else{
      body.addClass('menu-off');
      $rootScope.menuVisible = false;
    }
  };
  $scope.toggleMenu = function(){
    var body = angular.element('.body-container');
    $scope.setMenu(body.hasClass('menu-off'));
  };


  //Labels
  var assignLabels = function(){
    $scope.menuLabels = {
      management: languageTranslator.menu.management[$rootScope.language],
      dashboard: languageTranslator.menu.dashboard[$rootScope.language],
      activities: languageTranslator.menu.activities[$rootScope.language],
      courses: languageTranslator.menu.courses[$rootScope.language],
      groups: languageTranslator.menu.groups[$rootScope.language],
      users: languageTranslator.menu.users[$rootScope.language],
      account: languageTranslator.menu.account[$rootScope.language],
      settings: languageTranslator.menu.settings[$rootScope.language],
      import: languageTranslator.menu.import[$rootScope.language],
      reports: languageTranslator.menu.reports[$rootScope.language],
      overview: languageTranslator.menu.overview[$rootScope.language],
      logout: languageTranslator.menu.logout[$rootScope.language]
    };
  };
  assignLabels();
  $scope.$watch(function(){return $rootScope.language}, assignLabels);


  //Notifications wrapper
  $scope.notifications = $rootScope.notifications;
  //Notifications listener
  $scope.$on('not-authorized', function (event) {
    NotificationService.push({
      title: 'Not authorized',
      content: 'You are not allowed to view the requested resource.',
      link: null,
      type: NOTIFICATIONS_TYPES.error
    });
  });
  $scope.$on('not-found', function (event) {
    NotificationService.push({
      title: 'Not found',
      content: 'You are not allowed to view the requested resource.',
      link: null,
      type: NOTIFICATIONS_TYPES.error
    });
  });
  //Loading listener
  $scope.loading = false;
  $scope.$on('start-loading', function (event) {
    $scope.loading = true;
  });
  $scope.$on('stop-loading', function (event) {
    $scope.loading = false;
  });


  //TODO insert restrictions based on role (pending api restrictions based on token)
  //TODO impose these restrictions on url guessing as well
  $rootScope.$on('$stateChangeStart', function (event, next) {
    if (next.data && next.data.authorizedRoles){
      var authorizedRoles = next.data.authorizedRoles;
      // console.log(authorizedRoles);
      if (!AuthService.isAuthorized(authorizedRoles)) {
        event.preventDefault();
        if (AuthService.isAuthenticated()) {
          // user is not allowed
          // console.log("not-authorized");
          $rootScope.$broadcast("not-authorized");
        } else {
          // user is not logged in
          // console.log("not-authenticated");
          $rootScope.$broadcast("not-authenticated");
        }
      } else{
        $rootScope.$broadcast("start-loading");
      }
    }
  });
  $rootScope.$on('$stateChangeSuccess', function(event, toState){
    // $timeout(function(){
      $rootScope.$broadcast("stop-loading");
      $scope.setMenu($rootScope.menuVisible);
      // mixpanel.track("Video play", {
      //   "Page":
      // });
    // }, 500);
  });

  //TODO insert middleware to handle authentication filtering
  if (!AuthService.isAuthenticated()){
    NotificationService.push({
      title: 'Not authenticated',
      content: 'You are not logged in or your session expired. Please login again.',
      link: null,
      type: NOTIFICATIONS_TYPES.error
    });
    $state.go('login');
  };

  var assignModals = function(){
    $rootScope.modal = {
      'local': {},
      'confirm': {
        action: {
          value: null,
          params: null,
          submit: function(){
            if (typeof $scope.modal.confirm.action.value == 'function'){
              $scope.modal.confirm.action.value($scope.modal.confirm.action.params);
            };
            angular.element('#confirm-modal').modal('hide');
            angular.element('.modal-backdrop').remove();
          }
        },
        title: languageTranslator.modals.logout.title[$rootScope.language],
        cancel: languageTranslator.buttons.cancel[$rootScope.language],
        submit: languageTranslator.buttons.logout[$rootScope.language],
        data: {},
        loading: false,
        this: function(callback, type, params){
          angular.element('#confirm-modal').modal('show');
          switch (type){
            case 'logout':
              $scope.modal['confirm'].title = languageTranslator.modals.logout.title[$rootScope.language];
              $scope.modal['confirm'].cancel = languageTranslator.buttons.cancel[$rootScope.language];
              $scope.modal['confirm'].submit = languageTranslator.buttons.logout[$rootScope.language];
              break;
            case 'delete':
              $scope.modal['confirm'].title = languageTranslator.modals.delete.title[$rootScope.language];
              $scope.modal['confirm'].cancel = languageTranslator.buttons.cancel[$rootScope.language];
              $scope.modal['confirm'].submit = languageTranslator.buttons.delete[$rootScope.language];
              break;
          }
          $scope.modal.confirm.action.value = callback;
          $scope.modal.confirm.action.params = params;
        }
      },
      'view-activity': {
        action: {
          callback: null,
          params: null,
          submit: function(){
            if (typeof $scope.modal.confirm.action.callback == 'function'){
              $scope.modal.confirm.action.callback($scope.modal.confirm.action.params);
            };
            angular.element('#view-activity-modal').modal('hide');
            angular.element('.modal-backdrop').remove();
          },
          cancel: function(){
            angular.element('#view-activity-modal').modal('hide');
            angular.element('.modal-backdrop').remove();
          }
        },
        title: languageTranslator.tables.activityDetails[$rootScope.language],
        cancel: languageTranslator.buttons.close[$rootScope.language],
        submit: languageTranslator.buttons.logout[$rootScope.language],
        labels: {
          placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders),
          table: $rootScope.getTranslatedObject(languageTranslator.tables),
          errors: $rootScope.getTranslatedObject(languageTranslator.errors),
          buttons: $rootScope.getTranslatedObject(languageTranslator.buttons),
          marked: languageTranslator.modals.addGrades.marked[$rootScope.language]
        },
        table: {
          title : '',
          columns : {
            user: languageTranslator.tables.student[$rootScope.language],
            activity: languageTranslator.tables.activity[$rootScope.language],
            course: languageTranslator.tables.course[$rootScope.language]
          },
          retrieveLink : function(){
            return '';
          },
          extraRows : []
        },
        loading: false,
        loadingMessage: languageTranslator.tables.loading[$rootScope.language],
        data: {},
        editMode: false,
        toggleEdit: function(){
          $scope.modal['view-activity'].editMode = !$scope.modal['view-activity'].editMode;
        },
        saveEdit: function(){
          switch($scope.modal['view-activity'].activity.type){
            case 'grades':
              console.log('save edit');
              if ($scope.modal['view-activity'].data.newGrade != $scope.modal['view-activity'].activity.value){
                //Edit activity here
                $scope.modal['view-activity'].loadingMessage = languageTranslator.modals.addGrades.loading2[$rootScope.language];
                $scope.modal['view-activity'].loading = true;
              }
              break;
          }
        },
        loading: false,
        this: function(activityParams){
          angular.element('#view-activity-modal').modal('show');
          //Set edit mode settings
          $scope.modal['view-activity'].editMode = false;
          $scope.modal['view-activity'].loading = true;
          $scope.modal['view-activity'].loadingMessage = languageTranslator.tables.loading[$rootScope.language];
          //Load the data for the specific activity
          var resource;
          var params;
          switch(activityParams.type){
            case 'attendances':
              resource = Attendances;
              params = {
                student_id: activityParams.user_id,
                activity_id: activityParams.activity_id,
              };
              break;
            case 'grades':
              resource = Grades;
              params = {
                student_id: activityParams.user_id,
                activity_id: activityParams.activity_id,
              };
              break;
            case 'files':
              resource = Files;
              params = {
                file_id: activityParams.file_id,
              };
              break;
          }
          //Set ordered title
          $scope.modal["view-activity"].table.title = undefined;
          switch ($rootScope.language){
            case 'en':
              $scope.modal["view-activity"].table.title  = [languageTranslator.tables[activityParams.type.slice(0,-1)][$rootScope.language],languageTranslator.tables.details[$rootScope.language]].join(' ');
              break;
            case 'ro':
              $scope.modal["view-activity"].table.title  = [languageTranslator.tables.details[$rootScope.language], languageTranslator.tables[activityParams.type.slice(0,-1)][$rootScope.language]].join(' ');
              break;
          }
          $scope.modal["view-activity"].title = $scope.modal["view-activity"].table.title;
          //Get resource
          resource.getById(params).$promise.then(function(response){
            response.type = activityParams.type;
            response.user = response.student;
            response.user.type = 'student';
            response.user.tag = 'tag-'+response.user.type;
            delete response.student;
            $scope.modal["view-activity"].activity = response;
            //Set retrieve path
            $scope.modal["view-activity"].table.retrieveLink = function(){
              return config.apiEndpoint+'storage/retrieve/'+response.id+'?k='+$rootScope.authUser.token;
            };
            //Set extra rows
            switch(response.type){
              case 'attendances':
                $scope.modal['view-activity'].table.extraRows = [];
                break;
              case 'grades':
                $scope.modal['view-activity'].data.newGrade = $scope.modal['view-activity'].activity.value;
                $scope.modal['view-activity'].table.extraRows = [{
                    title : $scope.modal['view-activity'].labels.table.value,
                    value : $scope.modal['view-activity'].activity.value,
                    customClass : 'tag tag-auto tag-grade',
                    canEdit: true
                }];
                break;
              case 'files':
                $scope.modal['view-activity'].table.extraRows = [{
                    title : $scope.modal['view-activity'].labels.table.file,
                    value : $scope.modal['view-activity'].activity.fileName+'.'+$scope.modal['view-activity'].activity.extension,
                    customClass : '',
                    hasDownloadButton: true,
                    canEdit: false
                  },{
                    title: $scope.modal['view-activity'].labels.table.type,
                    value : $scope.modal['view-activity'].activity.extension,
                    customClass : 'tag tag-auto tag-file',
                    canEdit: false
                  },{
                    title: $scope.modal['view-activity'].labels.table.uploadDate,
                    value : $scope.modal['view-activity'].activity.uploadDate,
                    customClass : 'td-blue',
                    canEdit: false
                }];
                break;
            }
            $scope.modal['view-activity'].loading = false;
          }, function(response){
            console.log(response);
            $rootScope.$broadcast("not-authorized");
            return $q.reject("Rejection message!");
          });
        }
      },
      'add-course': {
        action: {
          value: function(){},
          submit: function(data){
            $scope.modal["add-course"].loading = true;
            $scope.modal.local.errors = {};
            var paramObj = {};
            paramObj.title = data.title;
            paramObj.year = data.year;
            paramObj.semester = data.semester;
            //Check parameters
            $scope.modal.local.errors.title = paramObj.title == undefined ? 'Course title required to continue' : undefined;
            $scope.modal.local.errors.year = paramObj.year == undefined ? 'Course year required to continue' : paramObj.year < 0 || !Number.isInteger(paramObj.year) ? 'Invalid year provided' : undefined;
            $scope.modal.local.errors.semester = paramObj.semester == undefined ? 'Course semester required to continue' : undefined;
            if ($scope.modal.local.errors.title === undefined && $scope.modal.local.errors.year === undefined && $scope.modal.local.errors.semester === undefined){
              Courses.addCourse(paramObj).$promise.then(function(response){
                angular.element('#add-course').modal('hide');
                angular.element('.modal-backdrop').remove();
                $scope.modal["add-course"].loading = false;
                $state.reload();
                //Send success notification
                NotificationService.push({
                  title: 'Course Created',
                  content: ['You have successfully created the course ', paramObj.title, '.'].join(''),
                  link: null,
                  type: NOTIFICATIONS_TYPES.success
                });
              }, function(error){
                console.log(error);
                $scope.modal["add-course"].loading = false;
              });
            }
            $scope.modal["add-course"].loading = false;
          }
        },
        title: 'Add Course',
        cancel: 'Cancel',
        submit: 'Add Course',
        data: {},
        loading: false,
        this: function(){
            $scope.modal["add-course"].loading = true;
            $scope.modal.local.errors = {};
            $scope.modal.local.semester = undefined;
            $scope.modal["add-course"].loading = false;
            //Got dependencies
            angular.element('#add-course').modal('show');
        }
      },
      'add-course-lecturer': {
        action: {
          value: function(){},
          submit: function(data){
            $scope.modal["add-course-lecturer"].loading = true;
            $scope.modal.local.errors = {};
            //Check parameters
            $scope.modal.local.errors.course = $scope.modal.local.courseId == undefined ? 'Course required to continue' : undefined;
            $scope.modal.local.errors.lecturer = $scope.modal.local.lecturer == undefined ? 'Lecturer required to continue' : undefined;
            if ($scope.modal.local.errors.course === undefined && $scope.modal.local.errors.lecturer === undefined){
              Courses.addCourseLecturer({
                  "course_id": $scope.modal.local.courseId.id,
                }, {
                  "lecturer_id": $scope.modal.local.lecturer.id
                }).$promise.then(function(response){
                angular.element('#add-course-lecturer').modal('hide');
                angular.element('.modal-backdrop').remove();
                $scope.modal["add-course-lecturer"].loading = false;
                $state.reload();
                //Send success notification
                NotificationService.push({
                  title: 'Lecturer Added',
                  content: ['You have successfully added the lecturer',$scope.modal.local.lecturer.lastName,$scope.modal.local.lecturer.lastName,'to the course', $scope.modal.local.courseId.title, '.'].join(' '),
                  link: null,
                  type: NOTIFICATIONS_TYPES.success
                });
              }, function(error){
                console.log(error);
                $scope.modal["add-course-lecturer"].loading = false;
              });
            } else{
              console.log($scope.modal.local);
              $scope.modal["add-course-lecturer"].loading = false;
            }
          }
        },
        title: 'Add Lecturer to Course',
        cancel: 'Cancel',
        submit: 'Add Lecturer',
        data: {},
        loading: false,
        filterLecturers: function(lecturer){
          if ($scope.modal.local.courseId !== undefined){
            var lecturerCoursesIds = lecturer.courses.map(function(param){ return param.id });
            return !(lecturerCoursesIds.indexOf($scope.modal.local.courseId.id) > -1);
          } else{
            return true;
          }
        },
        this: function(currentCourse){
            $scope.modal["add-course-lecturer"].loading = true;
            $scope.modal.local.errors = {};
            $scope.modal.local.semester = undefined;
            $scope.modal["add-course-lecturer"].loading = false;
            //Get dependencies
            $q.all([
              Courses.getAllUnpaged().$promise,
              Lecturers.getAllUnpaged().$promise,
            ]).then(function(response){
              //Modify course titles
              angular.forEach(response[0], function(value, key) {
                 value.title = [Array(value.year+1).join('I'),value.semester,' - ',value.title].join('');
              });
              response[0].sort( function(a,b) {return (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0);} );
              //Modify lecturer names
              angular.forEach(response[1], function(value, key) {
                 value.fullName = [value.lastName, value.firstName].join(' ');
              });
              response[1].sort( function(a,b) {return (a.fullName > b.fullName) ? 1 : ((b.fullName > a.fullName) ? -1 : 0);} );
              //Append data
              $scope.modal["add-course-lecturer"].data.courses = response[0];
              $scope.modal["add-course-lecturer"].data.lecturers = response[1];
              //Set default selected course if applicable
              $scope.modal.local.courseId = undefined;
              $scope.modal.local.lecturer = undefined;
              if (currentCourse !== undefined){
                $scope.modal.local.courseId = target.course;
              }
              $scope.modal["add-course-lecturer"].loading = false;
            });
            //Got dependencies
            angular.element('#add-course-lecturer').modal('show');
        }
      },
      'add-course-students': {
        action: {
          value: null,
          submit: function(){
            $scope.modal["add-course-students"].loading = true;
            $scope.modal.local.errors = {};
            if ($scope.modal['add-course-students'].step.current < $scope.modal['add-course-students'].step.max){
              $scope.modal['add-course-students'].step.showStep($scope.modal['add-course-students'].step.current+1);
            } else{
              $scope.modal['add-course-students'].loadingMessage = languageTranslator.modals.addCourseStudents.loading[$rootScope.language];
              //Building data object to Send
              var data = {
                'courseId': $scope.modal.local.courseId.id,
                'studentIds': []
              };
              angular.forEach($scope.modal.local.students, function(student, key){
                if (student.checked === true){
                    data.studentIds.push(student.id);
                }
              });
              if (data.studentIds.length == 0) {
                $scope.modal['add-course-students'].step.showStep($scope.modal['add-course-students'].step.max);
                $scope.modal.local.errors.student = languageTranslator.errors.studentAtLeastRequiredCourse[$rootScope.language];
              } else{
                Courses.addCourseStudents({
                    "course_id": $scope.modal.local.courseId.id,
                  }, {
                    "student_ids": data.studentIds
                  }).$promise.then(function(response){
                  angular.element('#add-course-lecturer').modal('hide');
                  angular.element('.modal-backdrop').remove();
                  $scope.modal["add-course-lecturer"].loading = false;
                  $state.reload();
                  //Send success notification
                  NotificationService.push({
                    title: languageTranslator.modals.addCourseStudents.notificationSuccess.title[$rootScope.language],
                    content: [languageTranslator.modals.addCourseStudents.notificationSuccess.content[$rootScope.language], $scope.modal.local.courseId.title, '.'].join(' '),
                    link: null,
                    type: NOTIFICATIONS_TYPES.success
                  });
                }, function(error){
                  $scope.modal["add-course-lecturer"].loading = false;
                });
              }
            }
          },
          cancel: function(){
            if ($scope.modal['add-course-students'].step.current > 1){
              $scope.modal['add-course-students'].step.showStep($scope.modal['add-course-students'].step.current - 1);
            } else{
              angular.element('#add-course-students').modal('hide');
              angular.element('.modal-backdrop').remove();
            }
          }
        },
        step: {
          current: 1,
          max: 2,
          title: languageTranslator.modals.addCourseStudents.step[0].title[$rootScope.language],
          details: [],
          showStep: function(step){
            switch(step){
              case 1:
                $scope.modal['add-course-students'].loadingMessage = languageTranslator.modals.addCourseStudents.step[0].loading[$rootScope.language];
                $scope.modal['add-course-students'].step.current = 1;
                $scope.modal['add-course-students'].submit = languageTranslator.buttons.next[$rootScope.language];
                $scope.modal['add-course-students'].cancel = languageTranslator.buttons.cancel[$rootScope.language];
                $scope.modal['add-course-students'].step.title = languageTranslator.modals.addCourseStudents.step[0].title[$rootScope.language];
                $scope.modal['add-course-students'].step.details = [];
                $scope.modal["add-course-students"].loading = false;
                break;
              case 2:
                $scope.modal['add-course-students'].loadingMessage = languageTranslator.modals.addCourseStudents.step[1].loading[$rootScope.language];
                $scope.modal["add-course-students"].loading = true;
                var canContinue = true;
                //Check requirements
                if ($scope.modal.local.courseId==undefined){
                  $scope.modal.local.errors.course = languageTranslator.errors.courseRequired[$rootScope.language];
                  $scope.modal['add-course-students'].step.showStep(1);
                  canContinue = false;
                }
                if (!canContinue){
                  break;
                }
                //Retrieve Values
                $q.all([
                  Students.getAllUnpaged().$promise,
                  Groups.getAllUnpaged().$promise
                ]).then(function(response){
                  $scope.modal.local.students = response[0];
                  $scope.modal['add-course-students'].data.groups = response[1];
                  //Adding checked/unchecked status to students
                  var count = 0
                  var newStudents = [];
                  for (var index = 0; index< $scope.modal.local.students.length; index+=1){
                    var isDeleted = false;
                    var student = $scope.modal.local.students[index];
                    angular.forEach(student.courses, function(course, courseKey){
                      if (course.id === $scope.modal.local.courseId.id){
                        isDeleted = true;
                      }
                    });
                    if (isDeleted === false){
                      student.checked = false;
                      student.visible = true;
                      student.index = ++count;
                      newStudents.push(student);
                    }
                  }
                  $scope.modal.local.students = newStudents;
                  console.log($scope.modal.local.students);
                  //Modifying name of groups
                  var count = 0
                  angular.forEach($scope.modal['add-course-students'].data.groups, function(group, key){
                    group.name = [group.year,group.name].join('-');
                  });
                  //Finish loading
                  $scope.modal["add-course-students"].loading = false;
                }, function(error){
                  console.log(error);
                  $scope.modal["add-course-students"].loading = false;
                  $scope.modal['add-course-students'].step.showStep(1);
                });
                //Set Values
                $scope.modal['add-course-students'].step.current = 2;
                $scope.modal['add-course-students'].submit = languageTranslator.buttons.save[$rootScope.language];
                $scope.modal['add-course-students'].cancel = languageTranslator.buttons.back[$rootScope.language];
                $scope.modal['add-course-students'].step.title = languageTranslator.modals.addCourseStudents.step[1].title[$rootScope.language];
                $scope.modal['add-course-students'].step.details= [{
                  class: 'p-green',
                  content: $scope.modal.local.courseId.title
                }, {
                  class: 'p-sm',
                  content: ['Year',$scope.modal.local.courseId.year,'/ Semester',$scope.modal.local.courseId.semester].join(' ')
                }];
                break;
              default:
                angular.element('#add-course-students').modal('hide');
                angular.element('.modal-backdrop').remove();
                break;
            }
          }
        },
        title: languageTranslator.modals.addCourseStudents.title[$rootScope.language],
        cancel: languageTranslator.buttons.cancel[$rootScope.language],
        submit: languageTranslator.buttons.next[$rootScope.language],
        data: {},
        loading: false,
        loadingMessage: languageTranslator.modals.addCourseStudents.step[0].loading[$rootScope.language],
        labels: {
          title: languageTranslator.modals.addCourseStudents.title[$rootScope.language],
          placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders),
          table: $rootScope.getTranslatedObject(languageTranslator.tables),
          errors: $rootScope.getTranslatedObject(languageTranslator.errors),
          add: languageTranslator.modals.addCourseStudents.add[$rootScope.language]
        },
        search: {
          value: undefined,
          clear: function(){
            $scope.modal['add-course-students'].search.value = undefined;
            $scope.modal['add-course-students'].filterStudents();
          }
        },
        toggleCheck: function(studentIndex){
          $scope.modal.local.students[studentIndex].checked = !$scope.modal.local.students[studentIndex].checked;
        },
        filterStudents: function(){
          $scope.modal["add-course-students"].loading = true;
          var paramGroup = $scope.modal.local.groupId;
          var paramTerm = $scope.modal['add-course-students'].search.value;
          var name, count = 0;
          angular.forEach($scope.modal.local.students, function(student, key){
            if (paramGroup !== undefined){
              student.visible = false;
              angular.forEach(student.groups, function(group, gKey){
                if (group.id === paramGroup.id){
                  student.index = ++count;
                  student.visible = true;
                }
              });
              if (paramTerm !== undefined){
                name = student.firstName+' '+student.lastName;
                if (name.toLowerCase().indexOf(paramTerm.toLowerCase()) === -1){
                  student.visible = false;
                }
              }
            } else if (paramTerm !== undefined){
              student.visible = false;
              name = student.firstName+' '+student.lastName;
              if (name.toLowerCase().indexOf(paramTerm.toLowerCase()) >= 0){
                student.visible = true;
                student.index = ++count;
              }
            } else{
              student.visible = true;
              student.index = ++count;
            }
          });
          $scope.modal["add-course-students"].loading = false;
        },
        this: function(target){
          $scope.modal["add-course-students"].loading = true;
          $scope.modal['add-course-students'].step.showStep(1);
          $scope.modal.local.errors = {};
          //Get dependencies
          $q.all([
            Courses.getAllUnpaged().$promise
          ]).then(function(response){
            //Modify course titles
            angular.forEach(response[0], function(value, key) {
               value.title = [Array(value.year+1).join('I'),value.semester,' - ',value.title].join('');
            });
            response[0].sort( function(a,b) {return (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0);} );
            //Append data
            $scope.modal["add-course-students"].data.courses = response[0];
            //Set default selected course if applicable
            $scope.modal.local.courseId = undefined;
            if (target !== undefined && 'course' in target){
              $scope.modal.local.courseId = target.course;
              $scope.modal.local.activityId = target;
            }
            $scope.modal["add-course-students"].loading = false;
          });
          //Got dependencies
          angular.element('#add-course-students').modal('show');
        }
      },
      'add-activity': {
        action: {
          value: function(){},
          submit: function(data){
            $scope.modal["add-activity"].loading = true;
            $scope.modal.local.errors = {};
            var paramObj = {};
            paramObj.courseId = data.courseId;
            paramObj.typeId = data.typeId;
            paramObj.name = data.name;
            paramObj.date = $('#add-activity-datepicker').datepicker().data('datepicker').selectedDates[0] ? $('#add-activity-datepicker').datepicker().data('datepicker').selectedDates[0].getTime() : new Date().getTime();
            //Check parameters
            $scope.modal.local.errors.course = paramObj.courseId == undefined ? languageTranslator.errors.courseRequired[$rootScope.language] : undefined;
            $scope.modal.local.errors.type = paramObj.typeId == undefined ? languageTranslator.errors.typeRequired[$rootScope.language] : undefined;
            $scope.modal.local.errors.name = paramObj.name == undefined ? languageTranslator.errors.nameRequired[$rootScope.language] : undefined;
            $scope.modal.local.errors.date = paramObj.date == undefined ? languageTranslator.errors.dateRequired[$rootScope.language] : undefined;
            if (paramObj.courseId !== undefined && paramObj.typeId !== undefined && paramObj.name !== undefined && paramObj.date !== undefined){
              //Data
              Activities.addActivity(paramObj).$promise.then(function(response){
                angular.element('#add-activity').modal('hide');
                angular.element('.modal-backdrop').remove();
                $scope.modal["add-activity"].loading = false;
                $state.reload();
                //Send success notification
                console.log('activity response',response);
                NotificationService.push({
                  title: languageTranslator.modals.addActivity.notificationSuccess.title[$rootScope.language],
                  content: [languageTranslator.modals.addActivity.notificationSuccess.content[$rootScope.language],data.name,'.'].join(''),
                  link: null,
                  type: NOTIFICATIONS_TYPES.success
                });
              }, function(response){
                console.log(response);
                $scope.modal["add-activity"].loading = false;
              });
            } else{
              $scope.modal["add-activity"].loading = false;
            }
          }
        },
        title: languageTranslator.modals.addActivity.title[$rootScope.language],
        cancel: languageTranslator.buttons.cancel[$rootScope.language],
        submit: languageTranslator.modals.addActivity.title[$rootScope.language],
        labels: {
          title: languageTranslator.modals.addActivity.title[$rootScope.language],
          loading: languageTranslator.modals.addActivity.loading[$rootScope.language],
          placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders),
          table: $rootScope.getTranslatedObject(languageTranslator.tables)
        },
        data: {},
        loading: false,
        this: function(targetCourse){
            $scope.modal["add-activity"].loading = true;
            $scope.modal.local.errors = {};
            //Getting dependencies
            $q.all([
              Courses.getAllUnpaged().$promise,
              Activities.getTypes().$promise
            ]).then(function(response){
              //Modify course titles
              angular.forEach(response[0], function(value, key) {
                 value.title = [Array(value.year+1).join('I'),value.semester,' - ',value.title].join('');
              });
              response[0].sort( function(a,b) {return (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0);} );
              //Append data
              $scope.modal["add-activity"].data.courses = response[0];
              $scope.modal["add-activity"].data.types = response[1];
              //Set start date
              var currentDate = new Date();
              currentDate.setMinutes(0);
              currentDate.setSeconds(0);
              currentDate.setMilliseconds(0);
              $('#add-activity-datepicker').datepicker({
                language: $rootScope.language,
                position: 'bottom left',
                startDate: currentDate,
                timepicker: 'true',
                minutesStep: 10,
                todayButton: true,
                ampm: false
              });
              //Set default selected course if applicable
              $scope.modal.local.courseId = targetCourse !== undefined ? targetCourse.id : undefined;
              $scope.modal["add-activity"].loading = false;
            });
            //Got dependencies
            angular.element('#add-activity').modal('show');
        }
      },
      'add-attendance': {
        action: {
          value: null,
          submit: function(){
            $scope.modal["add-attendance"].loading = true;
            $scope.modal.local.errors = {};
            if ($scope.modal['add-attendance'].step.current < $scope.modal['add-attendance'].step.max){
              $scope.modal['add-attendance'].step.showStep($scope.modal['add-attendance'].step.current+1);
            } else{
              $scope.modal['add-attendance'].loadingMessage = languageTranslator.modals.markAttendances.loading[$rootScope.language];
              //Building data object to Send
              var data = {
                'activityId': $scope.modal.local.activityId.id,
                'studentIds': []
              };
              angular.forEach($scope.modal.local.students, function(student, key){
                if (student.checked === true){
                    data.studentIds.push(student.id);
                }
              });
              if (data.studentIds.length == 0) {
                $scope.modal['add-attendance'].step.showStep($scope.modal['add-attendance'].step.max);
                $scope.modal.local.errors.student = languageTranslator.errors.studentAtLeastRequired[$rootScope.language];
              } else{
                // Final submit
                Attendances.addAttendances(data).$promise.then(function(response){
                  angular.element('#add-attendance').modal('hide');
                  angular.element('.modal-backdrop').remove();
                  $scope.modal["add-attendance"].loading = false;
                  $state.reload();
                  //Send success notification
                  NotificationService.push({
                    title: languageTranslator.modals.markAttendances.notificationSuccess.title[$rootScope.language],
                    content: [languageTranslator.modals.markAttendances.notificationSuccess.content[$rootScope.language],$scope.modal.local.activityId.name,'.'].join(''),
                    link: null,
                    type: NOTIFICATIONS_TYPES.success
                  });
                }, function(response){
                  console.log(response);
                  $scope.modal["add-attendance"].loading = false;
                });
              }
            }
          },
          cancel: function(){
            if ($scope.modal['add-attendance'].step.current > 1){
              $scope.modal['add-attendance'].step.showStep($scope.modal['add-attendance'].step.current - 1);
            } else{
              angular.element('#add-attendance').modal('hide');
              angular.element('.modal-backdrop').remove();
            }
          }
        },
        step: {
          current: 1,
          max: 2,
          title: 'Select Course & Activity',
          details: [],
          showStep: function(step){
            switch(step){
              case 1:
                $scope.modal['add-attendance'].loadingMessage = languageTranslator.modals.markAttendances.step[0].loading[$rootScope.language];
                $scope.modal['add-attendance'].step.current = 1;
                $scope.modal['add-attendance'].submit = languageTranslator.buttons.next[$rootScope.language];
                $scope.modal['add-attendance'].cancel = languageTranslator.buttons.cancel[$rootScope.language];
                $scope.modal['add-attendance'].step.title = languageTranslator.modals.markAttendances.step[0].title[$rootScope.language];
                $scope.modal['add-attendance'].step.details = [];
                $scope.modal["add-attendance"].loading = false;
                break;
              case 2:
                $scope.modal['add-attendance'].loadingMessage = languageTranslator.modals.markAttendances.step[1].loading[$rootScope.language];
                $scope.modal["add-attendance"].loading = true;
                var canContinue = true;
                //Check requirements
                if ($scope.modal.local.courseId==undefined){
                  $scope.modal.local.errors.course = languageTranslator.errors.courseRequired[$rootScope.language];
                  $scope.modal['add-attendance'].step.showStep(1);
                  canContinue = false;
                }
                if ($scope.modal.local.activityId==undefined){
                  $scope.modal.local.errors.activity = languageTranslator.errors.activityRequired[$rootScope.language];
                  $scope.modal['add-attendance'].step.showStep(1);
                  canContinue = false;
                }
                if (!canContinue){
                  break;
                }
                //Retrieve Values
                $q.all([
                  Students.getByCourseId({course_id: $scope.modal.local.courseId.id}).$promise,
                  Groups.getAllUnpaged().$promise
                ]).then(function(response){
                  $scope.modal.local.students = response[0];
                  $scope.modal['add-attendance'].data.groups = response[1];
                  //Adding checked/unchecked status to students
                  var count = 0
                  angular.forEach($scope.modal.local.students, function(student, key){
                    student.checked = false;
                    student.visible = true;
                    student.index = ++count;
                  });
                  //Modifying name of groups
                  var count = 0
                  angular.forEach($scope.modal['add-attendance'].data.groups, function(group, key){
                    group.name = [group.year,group.name].join('-');
                  });
                  //Finish loading
                  $scope.modal["add-attendance"].loading = false;
                }, function(error){
                  console.log(error);
                  $scope.modal["add-attendance"].loading = false;
                  $scope.modal['add-attendance'].step.showStep(1);
                });
                //Set Values
                $scope.modal['add-attendance'].step.current = 2;
                $scope.modal['add-attendance'].submit = languageTranslator.buttons.save[$rootScope.language];
                $scope.modal['add-attendance'].cancel = languageTranslator.buttons.back[$rootScope.language];
                $scope.modal['add-attendance'].step.title = languageTranslator.modals.markAttendances.step[1].title[$rootScope.language];
                $scope.modal['add-attendance'].step.details= [{
                  class: 'p-green',
                  content: [$scope.modal.local.activityId.name,'/',$scope.modal.local.courseId.title].join(' ')
                }, {
                  class: 'p-sm',
                  content: $scope.modal.local.activityId.date
                }];
                break;
              default:
                angular.element('#add-attendance').modal('hide');
                angular.element('.modal-backdrop').remove();
                break;
            }
          }
        },
        title: languageTranslator.modals.markAttendances.title[$rootScope.language],
        cancel: languageTranslator.buttons.cancel[$rootScope.language],
        submit: languageTranslator.buttons.next[$rootScope.language],
        data: {},
        loading: false,
        loadingMessage: languageTranslator.modals.markAttendances.step[0].loading[$rootScope.language],
        labels: {
          title: languageTranslator.modals.markAttendances.title[$rootScope.language],
          placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders),
          table: $rootScope.getTranslatedObject(languageTranslator.tables),
          errors: $rootScope.getTranslatedObject(languageTranslator.errors),
          attended: languageTranslator.modals.markAttendances.attended[$rootScope.language]
        },
        search: {
          value: undefined,
          clear: function(){
            $scope.modal['add-attendance'].search.value = undefined;
            $scope.modal['add-attendance'].filterStudents();
          }
        },
        toggleCheck: function(studentIndex){
          $scope.modal.local.students[studentIndex].checked = !$scope.modal.local.students[studentIndex].checked;
        },
        filterStudents: function(){
          $scope.modal["add-attendance"].loading = true;
          var paramGroup = $scope.modal.local.groupId;
          var paramTerm = $scope.modal['add-attendance'].search.value;
          var name, count = 0;
          angular.forEach($scope.modal.local.students, function(student, key){
            if (paramGroup !== undefined){
              student.visible = false;
              angular.forEach(student.groups, function(group, gKey){
                if (group.id === paramGroup.id){
                  student.index = ++count;
                  student.visible = true;
                }
              });
              if (paramTerm !== undefined){
                name = student.firstName+' '+student.lastName;
                if (name.toLowerCase().indexOf(paramTerm.toLowerCase()) === -1){
                  student.visible = false;
                }
              }
            } else if (paramTerm !== undefined){
              student.visible = false;
              name = student.firstName+' '+student.lastName;
              if (name.toLowerCase().indexOf(paramTerm.toLowerCase()) >= 0){
                student.visible = true;
                student.index = ++count;
              }
            } else{
              student.visible = true;
              student.index = ++count;
            }
          });
          $scope.modal["add-attendance"].loading = false;
        },
        refreshActivities: function(){
          if ($scope.modal.local.courseId){
            $scope.modal.local.activityDisabled = false;
            angular.forEach($scope.modal['add-attendance'].data.courses, function(course, key){
              // console.log($scope.modal.local.courseId);
              if (course.id === $scope.modal.local.courseId.id){
                $scope.modal['add-attendance'].data.activities = course.activities;
              }
            });
          } else{
            $scope.modal.local.activityDisabled = true;
          }
        },
        this: function(target){
          $scope.modal["add-attendance"].loading = true;
          $scope.modal['add-attendance'].step.showStep(1);
          $scope.modal.local.errors = {};
          //Get dependencies
          $q.all([
            Courses.getAllUnpaged().$promise
          ]).then(function(response){
            //Modify course titles
            angular.forEach(response[0], function(value, key) {
               value.title = [Array(value.year+1).join('I'),value.semester,' - ',value.title].join('');
            });
            response[0].sort( function(a,b) {return (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0);} );
            //Append data
            $scope.modal["add-attendance"].data.courses = response[0];
            //Set default selected course if applicable
            $scope.modal.local.courseId = undefined;
            $scope.modal.local.activityId = undefined;
            if (target !== undefined && 'course' in target){
              $scope.modal.local.courseId = target.course;
              $scope.modal.local.activityId = target;
              // $scope.modal.local.courseDisabled = true;
              // $scope.modal.local.activityDisabled = true;
              $scope.modal["add-attendance"].refreshActivities();
            } else if (target !== undefined){
              $scope.modal.local.courseId = target;
              // $scope.modal.local.courseDisabled = true;
              // $scope.modal.local.activityDisabled = false;
              $scope.modal["add-attendance"].refreshActivities();
            } else{
              // $scope.modal.local.courseDisabled = false;
              // $scope.modal.local.activityDisabled = true;
            }
            $scope.modal["add-attendance"].loading = false;
          });
          //Got dependencies
          angular.element('#add-attendance').modal('show');
        }
      },
      'add-grade': {
        action: {
          value: null,
          submit: function(){
            $scope.modal["add-grade"].loading = true;
            $scope.modal.local.errors = {};
            if ($scope.modal['add-grade'].step.current < $scope.modal['add-grade'].step.max){
              $scope.modal['add-grade'].step.showStep($scope.modal['add-grade'].step.current+1);
            } else{
              $scope.modal['add-grade'].loadingMessage = languageTranslator.modals.addGrades.loading[$rootScope.language];
              //Building data object to Send
              var data = {
                "activityId": $scope.modal.local.activityId.id,
                "studentsGrades": []
              };
              angular.forEach($scope.modal.local.students, function(student, key){
                if (student.grade !== null){
                  data.studentsGrades.push({
                    'studentId': student.id,
                    'grade': student.grade
                  });
                }
              });
              console.log(data);
              if (data.studentsGrades.length == 0) {
                $scope.modal['add-grade'].step.showStep($scope.modal['add-grade'].step.max);
                $scope.modal.local.errors.student = languageTranslator.errors.studentAtLeastRequiredGrade[$rootScope.language];
              } else{
                // Final submit
                Grades.addGrades(data).$promise.then(function(response){
                  angular.element('#add-grade').modal('hide');
                  angular.element('.modal-backdrop').remove();
                  $scope.modal["add-grade"].loading = false;
                  $state.reload();
                  console.log(response);
                  //Send success notification
                  NotificationService.push({
                    title: languageTranslator.modals.addGrades.notificationSuccess.title[$rootScope.language],
                    content: [languageTranslator.modals.addGrades.notificationSuccess.content[$rootScope.language],$scope.modal.local.activityId.name,'.'].join(''),
                    link: null,
                    type: NOTIFICATIONS_TYPES.success
                  });
                }, function(response){
                  console.log(response);
                  $scope.modal["add-grade"].loading = false;
                });
              }
            }
          },
          cancel: function(){
            if ($scope.modal['add-grade'].step.current > 1){
              $scope.modal['add-grade'].step.showStep($scope.modal['add-grade'].step.current - 1);
            } else{
              angular.element('#add-grade').modal('hide');
              angular.element('.modal-backdrop').remove();
            }
          }
        },
        step: {
          current: 1,
          max: 2,
          title: 'Select Course & Activity',
          details: [],
          showStep: function(step){
            switch(step){
              case 1:
                $scope.modal['add-grade'].loadingMessage = languageTranslator.modals.addGrades.step[0].loading[$rootScope.language];
                $scope.modal['add-grade'].step.current = 1;
                $scope.modal['add-grade'].submit = languageTranslator.buttons.next[$rootScope.language];
                $scope.modal['add-grade'].cancel = languageTranslator.buttons.cancel[$rootScope.language];
                $scope.modal['add-grade'].step.title = languageTranslator.modals.addGrades.step[0].title[$rootScope.language];
                $scope.modal['add-grade'].step.details = [];
                $scope.modal["add-grade"].loading = false;
                break;
              case 2:
                $scope.modal['add-grade'].loadingMessage = languageTranslator.modals.addGrades.step[1].loading[$rootScope.language];
                $scope.modal["add-grade"].loading = true;
                var canContinue = true;
                //Check requirements
                if ($scope.modal.local.courseId==undefined){
                  $scope.modal.local.errors.course = languageTranslator.errors.courseRequired[$rootScope.language];
                  $scope.modal['add-grade'].step.showStep(1);
                  canContinue = false;
                }
                if ($scope.modal.local.activityId==undefined){
                  $scope.modal.local.errors.activity = languageTranslator.errors.activityRequired[$rootScope.language];
                  $scope.modal['add-grade'].step.showStep(1);
                  canContinue = false;
                }
                if (!canContinue){
                  break;
                }
                //Retrieve Values
                $q.all([
                  Students.getByCourseId({course_id: $scope.modal.local.courseId.id}).$promise,
                  Groups.getAllUnpaged().$promise
                ]).then(function(response){
                  $scope.modal.local.students = response[0];
                  $scope.modal['add-grade'].data.groups = response[1];
                  //Adding checked/unchecked status to students
                  var count = 0
                  angular.forEach($scope.modal.local.students, function(student, key){
                    student.grade = null;
                    student.visible = true;
                    student.index = ++count;
                  });
                  //Modifying name of groups
                  var count = 0
                  angular.forEach($scope.modal['add-grade'].data.groups, function(group, key){
                    group.name = [group.year,group.name].join('-');
                  });
                  //Finish loading
                  $scope.modal["add-grade"].loading = false;
                }, function(error){
                  console.log(error);
                  $scope.modal["add-grade"].loading = false;
                  $scope.modal['add-grade'].step.showStep(1);
                });
                //Set Values
                $scope.modal['add-grade'].step.current = 2;
                $scope.modal['add-grade'].submit = languageTranslator.buttons.save[$rootScope.language];
                $scope.modal['add-grade'].cancel = languageTranslator.buttons.back[$rootScope.language];
                $scope.modal['add-grade'].step.title = languageTranslator.modals.addGrades.step[0].title[$rootScope.language];
                $scope.modal['add-grade'].step.details= [{
                  class: 'p-green',
                  content: [$scope.modal.local.activityId.name,'/',$scope.modal.local.courseId.title].join(' ')
                }, {
                  class: 'p-sm',
                  content: $scope.modal.local.activityId.date
                }];
                break;
              default:
                angular.element('#add-grade').modal('hide');
                angular.element('.modal-backdrop').remove();
                break;
            }
          }
        },
        title: languageTranslator.modals.addGrades.title[$rootScope.language],
        cancel: languageTranslator.buttons.cancel[$rootScope.language],
        submit: languageTranslator.buttons.next[$rootScope.language],
        data: {},
        labels: {
          title: languageTranslator.modals.addGrades.title[$rootScope.language],
          placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders),
          table: $rootScope.getTranslatedObject(languageTranslator.tables),
          errors: $rootScope.getTranslatedObject(languageTranslator.errors),
          marked: languageTranslator.modals.addGrades.marked[$rootScope.language]
        },
        loading: false,
        loadingMessage: 'Getting students',
        search: {
          value: undefined,
          clear: function(){
            $scope.modal['add-grade'].search.value = undefined;
            $scope.modal['add-grade'].filterStudents();
          }
        },
        filterStudents: function(){
          $scope.modal["add-grade"].loading = true;
          var paramGroup = $scope.modal.local.groupId;
          var paramTerm = $scope.modal['add-grade'].search.value;
          var name, count = 0;
          angular.forEach($scope.modal.local.students, function(student, key){
            if (paramGroup !== undefined){
              student.visible = false;
              angular.forEach(student.groups, function(group, gKey){
                if (group.id === paramGroup.id){
                  student.index = ++count;
                  student.visible = true;
                }
              });
              if (paramTerm !== undefined){
                name = student.firstName+' '+student.lastName;
                if (name.toLowerCase().indexOf(paramTerm.toLowerCase()) === -1){
                  student.visible = false;
                }
              }
            } else if (paramTerm !== undefined){
              student.visible = false;
              name = student.firstName+' '+student.lastName;
              if (name.toLowerCase().indexOf(paramTerm.toLowerCase()) >= 0){
                student.visible = true;
                student.index = ++count;
              }
            } else{
              student.visible = true;
              student.index = ++count;
            }
          });
          $scope.modal["add-grade"].loading = false;
        },
        refreshActivities: function(){
          if ($scope.modal.local.courseId){
            $scope.modal.local.activityDisabled = false;
            angular.forEach($scope.modal['add-grade'].data.courses, function(course, key){
              // console.log($scope.modal.local.courseId);
              if (course.id === $scope.modal.local.courseId.id){
                $scope.modal['add-grade'].data.activities = course.activities;
              }
            });
          } else{
            $scope.modal.local.activityDisabled = true;
          }
        },
        this: function(target){
          $scope.modal["add-grade"].loading = true;
          $scope.modal['add-grade'].step.showStep(1);
          $scope.modal.local.errors = {};
          //Get dependencies
          $q.all([
            Courses.getAllUnpaged().$promise
          ]).then(function(response){
            //Modify course titles
            angular.forEach(response[0], function(value, key) {
               value.title = [Array(value.year+1).join('I'),value.semester,' - ',value.title].join('');
            });
            response[0].sort( function(a,b) {return (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0);} );
            //Append data
            $scope.modal["add-grade"].data.courses = response[0];
            //Set default selected course if applicable
            $scope.modal.local.courseId = undefined;
            $scope.modal.local.activityId = undefined;
            if (target !== undefined && 'course' in target){
              $scope.modal.local.courseId = target.course;
              $scope.modal.local.activityId = target;
              // $scope.modal.local.courseDisabled = true;
              // $scope.modal.local.activityDisabled = true;
              $scope.modal["add-grade"].refreshActivities();
            } else if (target !== undefined){
              $scope.modal.local.courseId = target;
              // $scope.modal.local.courseDisabled = true;
              // $scope.modal.local.activityDisabled = false;
              $scope.modal["add-grade"].refreshActivities();
            } else{
              // $scope.modal.local.courseDisabled = false;
              // $scope.modal.local.activityDisabled = true;
            }
            $scope.modal["add-grade"].loading = false;
          });
          //Got dependencies
          angular.element('#add-grade').modal('show');
        }
      },
      'add-file': {
        action: {
          value: function(){},
          submit: function(data){
            $scope.modal["add-file"].loading = true;
            $scope.modal.local.errors = {};
            //Parsing data
            if ($scope.modal['add-file'].step.current < $scope.modal['add-file'].step.max){
              $scope.modal['add-file'].step.showStep($scope.modal['add-file'].step.current+1);
            } else{
              if ($scope.modal.local.fileName == undefined || $scope.modal.local.fileName.length < 3){
                $scope.modal.local.errors.fileName = 'Enter a valid filename with at least 3 characters';
                $scope.modal['add-file'].step.showStep($scope.modal['add-file'].step.max);
              } else{
                $scope.modal['add-file'].loadingMessage = 'Uploading File';
                data.file = document.getElementById('upload-file').files[0];
                console.log(data);
                var formData = new FormData();
                formData.append('file', data.file);
                formData.append('activityId', data.activityId.id);
                formData.append('fileName', data.fileName);
                //Sending data
                Files.addFile(formData).$promise.then(function(response){
                  console.log(response);
                  angular.element('#add-file').modal('hide');
                  angular.element('.modal-backdrop').remove();
                  $scope.modal["add-file"].loading = true;
                  $state.reload();
                  //Send success notification
                  NotificationService.push({
                    title: 'File uploaded',
                    content: ['You have successfully uploaded the file ',data.fileName,'.'].join(''),
                    link: null,
                    type: NOTIFICATIONS_TYPES.success
                  });
                }, function(error){
                  console.log(error);
                  $scope.modal["add-file"].loading = false;
                });
              }
            }
          },
          cancel: function(){
            if ($scope.modal['add-file'].step.current > 1){
              $scope.modal['add-file'].step.showStep($scope.modal['add-file'].step.current - 1);
            } else{
              angular.element('#add-file').modal('hide');
              angular.element('.modal-backdrop').remove();
            }
          }
        },
        title: 'Upload File',
        cancel: 'Cancel',
        submit: 'Upload',
        data: {},
        loading: false,
        step: {
          current: 1,
          max: 2,
          title: 'Select Course & Activity',
          details: [],
          showStep: function(step){
            switch(step){
              case 1:
                $scope.modal['add-file'].loadingMessage = 'Getting courses & activities';
                $scope.modal['add-file'].step.current = 1;
                $scope.modal['add-file'].submit = 'Next';
                $scope.modal['add-file'].cancel = 'Cancel';
                $scope.modal['add-file'].step.title = 'Select Course & Activity';
                $scope.modal['add-file'].step.details = [];
                $scope.modal["add-file"].loading = false;
                break;
              case 2:
                $scope.modal['add-file'].loadingMessage = 'Loading';
                $scope.modal["add-file"].loading = true;
                var canContinue = true;
                //Check requirements
                if ($scope.modal.local.courseId==undefined){
                  $scope.modal.local.errors.course = 'Course required to continue';
                  $scope.modal['add-file'].step.showStep(1);
                  canContinue = false;
                }
                if ($scope.modal.local.activityId==undefined){
                  $scope.modal.local.errors.activity = 'Activity required to continue';
                  $scope.modal['add-file'].step.showStep(1);
                  canContinue = false;
                }
                if (!canContinue){
                  break;
                }
                //Set Values
                $scope.modal['add-file'].step.current = 2;
                $scope.modal['add-file'].submit = 'Upload';
                $scope.modal['add-file'].cancel = 'Back';
                $scope.modal['add-file'].step.title = 'Select File';
                $scope.modal['add-file'].step.details = [{
                  class: 'p-green',
                  content: [$scope.modal.local.activityId.name,'/',$scope.modal.local.courseId.title].join(' ')
                }, {
                  class: 'p-sm',
                  content: $scope.modal.local.activityId.date
                }];
                $scope.modal["add-file"].loading = false;
                break;
              default:
                angular.element('#add-file').modal('hide');
                angular.element('.modal-backdrop').remove();
                break;
            }
          }
        },
        refreshActivities: function(){
          if ($scope.modal.local.courseId){
            angular.forEach($scope.modal['add-file'].data.courses, function(course, key){
              // console.log($scope.modal.local.courseId);
              if (course.id === $scope.modal.local.courseId.id){
                $scope.modal['add-file'].data.activities = course.activities;
              }
            });
          }
        },
        this: function(target){
            $scope.modal["add-file"].loading = true;
            $scope.modal["add-file"].step.showStep(1);
            $scope.modal.local.errors = {};
            //Get dependencies
            $q.all([
              Courses.getAllUnpaged().$promise
            ]).then(function(response){
              //Modify course titles
              angular.forEach(response[0], function(value, key) {
                 value.title = [Array(value.year+1).join('I'),value.semester,' - ',value.title].join('');
              });
              response[0].sort( function(a,b) {return (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0);} );
              //Append data
              $scope.modal["add-file"].data.courses = response[0];
              //Set default selected course if applicable
              $scope.modal.local.courseId = undefined;
              $scope.modal.local.activityId = undefined;
              if (target !== undefined && 'course' in target){
                $scope.modal.local.courseId = target.course;
                $scope.modal.local.activityId = target;
                // $scope.modal.local.courseDisabled = true;
                // $scope.modal.local.activityDisabled = true;
                $scope.modal["add-file"].refreshActivities();
              } else if (target !== undefined){
                $scope.modal.local.courseId = target;
                // $scope.modal.local.courseDisabled = true;
                // $scope.modal.local.activityDisabled = false;
                $scope.modal["add-file"].refreshActivities();
              } else{
                // $scope.modal.local.courseDisabled = false;
                // $scope.modal.local.activityDisabled = false;
              }
              $scope.modal["add-file"].loading = false;
            });
            //Got dependencies
            angular.element('#add-file').modal('show');
        }
      },
      'add-user': {
        action: {
          value: null,
          submit: function(){
            $scope.modal["add-user"].loading = true;
            $scope.modal.local.errors = {};
            if ($scope.modal['add-user'].step.current < $scope.modal['add-user'].step.max){
              $scope.modal['add-user'].step.showStep($scope.modal['add-user'].step.current+1);
            } else{
              $scope.modal['add-user'].loadingMessage = languageTranslator.modals.addUser.finalLoading[$rootScope.language];
              //Building data object to Send
              var canContinue = true;
              if ($scope.modal.local.email==undefined){
                $scope.modal.local.errors.email = languageTranslator.errors.emailRequired[$rootScope.language];
                $scope.modal['add-user'].step.showStep(2);
                canContinue = false;
              }
              if ($scope.modal.local.password==undefined){
                $scope.modal.local.errors.password = languageTranslator.errors.passwordRequired[$rootScope.language];
                $scope.modal['add-user'].step.showStep(2);
                canContinue = false;
              }
              if ($scope.modal.local.rpassword==undefined){
                $scope.modal.local.errors.rpassword = languageTranslator.errors.confirmPasswordRequired[$rootScope.language];
                $scope.modal['add-user'].step.showStep(2);
                canContinue = false;
              } else if ($scope.modal.local.password !== $scope.modal.local.rpassword){
                $scope.modal.local.errors.rpassword = languageTranslator.errors.passwordNoMatch[$rootScope.language];
                $scope.modal['add-user'].step.showStep(2);
                canContinue = false;
              }
              //If can canContinue
              if (canContinue){
                //Build data
                var data = $scope.modal.local;
                var resource;
                switch($scope.modal.local.type){
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
                console.log(data);
                resource.add(data).$promise.then(function(response){
                  angular.element('#add-user').modal('hide');
                  angular.element('.modal-backdrop').remove();
                  $scope.modal["add-user"].loading = false;
                  $state.reload();
                  //Send success notification
                  NotificationService.push({
                    title: languageTranslator.modals.addUser.notificationSuccess.title[$rootScope.language],
                    content: [languageTranslator.modals.addUser.notificationSuccess.content[$rootScope.language], $scope.modal.local.firstName,' ', $scope.modal.local.lastName,'.'].join(''),
                    link: null,
                    type: NOTIFICATIONS_TYPES.success
                  });
                }, function(response){
                  console.log(response);
                  if (response.status === 409){
                    NotificationService.push({
                      title: languageTranslator.modals.addUser.notificationError.title[$rootScope.language],
                      content: [languageTranslator.modals.addUser.notificationError.content[$rootScope.language], $scope.modal.local.email,'.'].join(''),
                      link: null,
                      type: NOTIFICATIONS_TYPES.error
                    });
                    angular.element('#add-user').modal('hide');
                    angular.element('.modal-backdrop').remove();
                  }
                  $scope.modal["add-user"].loading = false;
                });
              }
            }
          },
          cancel: function(){
            if ($scope.modal['add-user'].step.current > 1){
              $scope.modal['add-user'].step.showStep($scope.modal['add-user'].step.current - 1);
            } else{
              angular.element('#add-user').modal('hide');
              angular.element('.modal-backdrop').remove();
            }
          }
        },
        step: {
          current: 1,
          max: 2,
          title: languageTranslator.modals.addUser.step[0].title[$rootScope.language],
          details: [],
          showStep: function(step){
            switch(step){
              case 1:
                $scope.modal['add-user'].loadingMessage = languageTranslator.modals.addUser.step[0].loading[$rootScope.language];
                $scope.modal['add-user'].step.current = 1;
                $scope.modal['add-user'].submit = languageTranslator.buttons.next[$rootScope.language];
                $scope.modal['add-user'].cancel = languageTranslator.buttons.cancel[$rootScope.language];
                $scope.modal['add-user'].step.title = languageTranslator.modals.addUser.step[0].title[$rootScope.language];
                $scope.modal['add-user'].step.details = [];
                $scope.modal["add-user"].loading = false;
                break;
              case 2:
                $scope.modal['add-user'].loadingMessage = languageTranslator.modals.addUser.step[1].loading[$rootScope.language];
                $scope.modal["add-user"].loading = true;
                var canContinue = true;
                //Check requirements
                if ($scope.modal.local.type==undefined){
                  $scope.modal.local.errors.type = languageTranslator.errors.typeRequired[$rootScope.language];
                  $scope.modal['add-user'].step.showStep(1);
                  canContinue = false;
                }
                if ($scope.modal.local.firstName==undefined){
                  $scope.modal.local.errors.firstName = languageTranslator.errors.firstNameRequired[$rootScope.language];
                  $scope.modal['add-user'].step.showStep(1);
                  canContinue = false;
                }
                if ($scope.modal.local.lastName==undefined){
                  $scope.modal.local.errors.lastName = languageTranslator.errors.lastNameRequired[$rootScope.language];
                  $scope.modal['add-user'].step.showStep(1);
                  canContinue = false;
                }
                if (!canContinue){
                  break;
                }
                //Retrieve Values

                //Set Values
                $scope.modal['add-user'].step.current = 2;
                $scope.modal['add-user'].submit = languageTranslator.buttons.save[$rootScope.language];
                $scope.modal['add-user'].cancel = languageTranslator.buttons.back[$rootScope.language];
                $scope.modal['add-user'].step.title = languageTranslator.modals.addUser.step[1].title[$rootScope.language];
                $scope.modal['add-user'].step.details= [{
                  class: 'p-green',
                  content: [$scope.modal.local.firstName,$scope.modal.local.lastName].join(' ')
                }, {
                  class: 'p-sm',
                  content: $scope.modal.local.type[0].toUpperCase()+$scope.modal.local.type.slice(1)
                }];
                $scope.modal["add-user"].loading = false;
                break;
              default:
                angular.element('#add-user').modal('hide');
                angular.element('.modal-backdrop').remove();
                break;
            }
          }
        },
        title: languageTranslator.modals.addUser.title[$rootScope.language],
        cancel: languageTranslator.buttons.cancel[$rootScope.language],
        submit: languageTranslator.buttons.next[$rootScope.language],
        data: {},
        loading: false,
        loadingMessage: languageTranslator.modals.addUser.step[0].loading[$rootScope.language],
        labels: {
          title: languageTranslator.modals.addUser.title[$rootScope.language],
          placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders),
          table: $rootScope.getTranslatedObject(languageTranslator.tables),
          errors: $rootScope.getTranslatedObject(languageTranslator.errors)
        },
        this: function(){
          $scope.modal["add-user"].loading = true;
          $scope.modal['add-user'].step.showStep(1);
          console.log('fired');
          $scope.modal.local = {};
          $scope.modal.local.errors = {};
          //No dependencies to get so finish loading
          $scope.modal["add-user"].loading = false;
          //Got dependencies
          angular.element('#add-user').modal('show');
        }
      },
      'import': {
        action: {
          value: null,
          submit: function(){
              $scope.modal["import"].loading = true;
              var canContinue = true;
              var data = {
                file: document.getElementById('import-file').files[0]
              };
              if (typeof data.file == 'undefined'){
                $scope.modal.local.errors.file = languageTranslator.errors.fileNotSelected[$rootScope.language];
                canContinue = false;
              }
              //If can canContinue
              if (canContinue){
                //Build data
                var formData = new FormData();
                formData.append('file', data.file);
                Storage.import({
                  'type': $scope.modal['import'].data.type
                }, formData).$promise.then(function(response){
                  angular.element('#import').modal('hide');
                  angular.element('.modal-backdrop').remove();
                  $scope.modal["import"].loading = false;
                  //Send success notification
                  NotificationService.push({
                    title: languageTranslator.modals.import.notificationSuccess.title[$rootScope.language],
                    content: [languageTranslator.modals.import.notificationSuccess.content[$rootScope.language],' ',$scope.modal['import'].labels.table[$scope.modal['import'].data.type],'.'].join(''),
                    link: null,
                    type: NOTIFICATIONS_TYPES.success
                  });
                }, function(response){
                  console.log(response);
                  if (response.data)
                    $scope.modal.local.errors.submit = response.data.message;
                  $scope.modal["import"].loading = false;
                });
              }
          },
          cancel: function(){
            angular.element('#import').modal('hide');
            angular.element('.modal-backdrop').remove();
          }
        },
        title: languageTranslator.modals.import.title[$rootScope.language],
        description: languageTranslator.modals.import.description[$rootScope.language],
        cancel: languageTranslator.buttons.cancel[$rootScope.language],
        submit: languageTranslator.buttons.import[$rootScope.language],
        data: {},
        loading: false,
        loadingMessage: languageTranslator.modals.import.loading[$rootScope.language],
        labels: {
          title: languageTranslator.modals.addUser.title[$rootScope.language],
          placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders),
          table: $rootScope.getTranslatedObject(languageTranslator.tables),
          errors: $rootScope.getTranslatedObject(languageTranslator.errors)
        },
        this: function(type){
          $scope.modal["import"].loading = true;
          $scope.modal.local = {};
          $scope.modal.local.errors = {};
          $scope.modal["import"].title = [languageTranslator.modals.import.title[$rootScope.language], $scope.modal["import"].labels.table[type]].join(" ");
          $scope.modal["import"].data.type = type;
          //Finish loading
          $scope.modal["import"].loading = false;
          angular.element('#import').modal('show');
        }
      }
    };
  };
  assignModals();
  $scope.modal = $rootScope.modal;
  $scope.$watch(function(){return $rootScope.language;}, function(){assignModals();$scope.modal = $rootScope.modal;});

}]);

app.constant('NOTIFICATIONS_TYPES', {
  default: 'default-notification',
  error: 'error-notification',
  success: 'success-notification'
});
