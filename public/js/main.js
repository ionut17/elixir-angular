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

app.run(function($rootScope, $timeout, $state, $cookies, config, languageTranslator) {
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

app.controller('BaseController', ['$scope', '$rootScope', '$q', 'AuthService', '$state', '$timeout', 'config', 'NOTIFICATIONS_TYPES', 'NotificationService', 'languageTranslator', 'Students', 'Lecturers', 'Admins', 'Courses', 'Groups', 'Activities', 'Attendances', 'Grades', 'Files',
      function($scope, $rootScope, $q, AuthService, $state, $timeout, config, NOTIFICATIONS_TYPES, NotificationService, languageTranslator, Students, Lecturers, Admins, Courses, Groups, Activities, Attendances, Grades, Files) {
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
              console.log($scope.modal.local.courseId.id, $scope.modal.local.lecturer.id);
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
            }
            console.log($scope.modal.local);
            $scope.modal["add-course-lecturer"].loading = false;
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
                $scope.modal["add-course-students"].loading = false;
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
            if (paramObj.courseId !== undefined && paramObj.typeId !== undefined && paramObj.name !== undefined && paramObj.name.length >= 3 && paramObj.date !== undefined){
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
                // Final submit
                // Attendances.addAttendances(data).$promise.then(function(response){
                //   angular.element('#add-user').modal('hide');
                //   angular.element('.modal-backdrop').remove();
                //   $scope.modal["add-user"].loading = false;
                //   $state.reload();
                //   //Send success notification
                //   NotificationService.push({
                //     title: languageTranslator.modals.markAttendances.notificationSuccess.title[$rootScope.language],
                //     content: [languageTranslator.modals.markAttendances.notificationSuccess.content[$rootScope.language],$scope.modal.local.activityId.name,'.'].join(''),
                //     link: null,
                //     type: NOTIFICATIONS_TYPES.success
                //   });
                // }, function(response){
                //   console.log(response);
                //   $scope.modal["add-user"].loading = false;
                // });
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

app.factory("Activities", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "activities", {}, {
        getBasic: {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getAll: {
            url: config.apiEndpoint + "activities/join",
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getAllUnpaged: {
            url: config.apiEndpoint + "activities/join/all",
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getTypes: {
            url: config.apiEndpoint + "activities/types",
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getDetails: {
            url: config.apiEndpoint + "activities/details/:id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getByActivityId: {
            url: config.apiEndpoint + "activities/join/:activity_id",
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        addActivity: {
            url: config.apiEndpoint + "activities",
            method: "POST",
            headers: {
                'Content': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        delete: {
          url: config.apiEndpoint + "activities/:activity_id",
          method: "DELETE",
          headers: {
              'Accept': 'application/json',
              Authorization: function() {
                  return "Bearer "+AuthService.getToken();
              }
          }
        }
    });
}]);

app.factory("Admins", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "admins", {}, {
        getAll: {
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "admins/:id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        add: {
            url: config.apiEndpoint + "admins",
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        }
    });
}]);

app.factory("Attendances", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "attendances", {}, {
        getAll: {
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "attendances/:activity_id/:student_id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getByActivityId: {
            url: config.apiEndpoint + "attendances/:activity_id",
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        addAttendances: {
            url: config.apiEndpoint + "attendances",
            method: "POST",
            isArray: true,
            headers: {
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        delete: {
          url: config.apiEndpoint + "attendances/:activity_id/:student_id",
          method: "DELETE",
          params: {activity_id:'@activity_id', student_id: '@student_id'},
          headers: {
              Authorization: function() {
                  return "Bearer "+AuthService.getToken();
              }
          }
        }
    });
}]);

app.factory("Courses", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "courses", {}, {
        getAll: {
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getAllUnpaged: {
            url: config.apiEndpoint + "courses/all",
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "courses/:id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getLecturers: {
            url: config.apiEndpoint + "courses/:id/lecturers",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getStudents: {
            url: config.apiEndpoint + "courses/:id/students",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getActivities: {
            url: config.apiEndpoint + "courses/:id/activities",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        addCourse: {
            url: config.apiEndpoint + "courses",
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        addCourseLecturer: {
            url: config.apiEndpoint + "courses/:course_id/lecturers",
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        addCourseStudents: {
            url: config.apiEndpoint + "courses/:course_id/students",
            method: "POST",
            isArray: true,
            headers: {
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        }
    });
}]);

app.factory("Files", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "files", {}, {
        getAll: {
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "files/file/:file_id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getByActivityId: {
            url: config.apiEndpoint + "files/:activity_id",
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getByActivityIdStudentId: {
            url: config.apiEndpoint + "files/:activity_id/:student_id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        addFile: {
            url: config.apiEndpoint + "storage/upload",
            method: "POST",
            headers: {
                "Content-Type": undefined,
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
    });
}]);

app.factory("Grades", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "grades", {}, {
        getAll: {
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "grades/:activity_id/:student_id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getByActivityId: {
            url: config.apiEndpoint + "grades/:activity_id",
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        addGrades: {
            url: config.apiEndpoint + "grades",
            method: "POST",
            isArray: true,
            headers: {
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        delete: {
          url: config.apiEndpoint + "grades/:activity_id/:student_id",
          method: "DELETE",
          params: {activity_id:'@activity_id', student_id: '@student_id'},
          headers: {
              Authorization: function() {
                  return "Bearer "+AuthService.getToken();
              }
          }
        }
    });
}]);

app.factory("Groups", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "groups", {}, {
        getAll: {
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getAllUnpaged: {
            url: config.apiEndpoint + "groups/all",
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "groups/:id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        }
    });
}]);

app.factory("Lecturers", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "lecturers", {}, {
        getAll: {
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getAllUnpaged: {
            url: config.apiEndpoint + "lecturers/all",
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "lecturers/:id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getCourses: {
            url: config.apiEndpoint + "lecturers/:id/courses",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        add: {
            url: config.apiEndpoint + "lecturers",
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        }
    });
}]);

app.factory("Storage", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "storage", {}, {
        retrieveFile: {
            url: config.apiEndpoint + "storage/download",
            method: "POST",
            headers: {
                'Accept': 'application/download',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        }
    });
}]);

app.factory("Students", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "students", {}, {
        getAll: {
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getAllUnpaged: {
            url: config.apiEndpoint + "students/all",
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "students/:id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getByCourseId: {
          url: config.apiEndpoint + "students/course/:course_id",
          method: "GET",
          isArray: true,
          headers: {
              'Accept': 'application/json',
              Authorization: function() {
                  return "Bearer "+AuthService.getToken();
              }
          }
        },
        getAttendances: {
            url: config.apiEndpoint + "students/:id/attendances",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getGrades: {
            url: config.apiEndpoint + "students/:id/grades",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getFiles: {
            url: config.apiEndpoint + "students/:id/files",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getGroups: {
            url: config.apiEndpoint + "students/:id/groups",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        getCourses: {
            url: config.apiEndpoint + "students/:id/courses",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        add: {
            url: config.apiEndpoint + "students",
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        addGroup: {
            url: config.apiEndpoint + "students/:id/groups",
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        }
    });
}]);

app.factory("Users", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "users", {}, {
        getAll: {
            method: "GET",
            // isArray: true,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        }
    });
}]);

app.constant("config", {
    development: true,
    apiEndpoint: "http://localhost:8080/api/",
    // apiEndpoint: "http://elixir.ionutrobert.com:8080/elixir-api/api/",
    icons: "material", //'material' or 'awesome'

    preloader: {
      artificialTime: 500 //milliseconds
    },

    notifications: {
      showDate: false,
      autoDismissTime: 8000, //milliseconds
    },

    authorizedRoles: {
      activities: {
        list: ['*'],
        sublist: ['*'],
        view: ['*'],
        create: ['ADMIN', 'LECTURER'],
        edit: ['ADMIN', 'LECTURER'],
        delete: ['ADMIN', 'LECTURER']
      },
      attendances: {
        create: ['ADMIN', 'LECTURER']
      },
      grades: {
        create: ['ADMIN', 'LECTURER']
      },
      files: {
        create: ['STUDENT']
      },
      courses: {
        list: ['*'],
        view: ['*'],
        create: ['ADMIN'],
        addLecturer: ['ADMIN'],
        addStudents: ['ADMIN', 'LECTURER'],
        tools: ['ADMIN'],
        edit: ['ADMIN'],
        delete: ['ADMIN']
      },
      dashboard: {
        view: ['*'],
        user: ['ADMIN', 'LECTURER']
      },
      groups: {
        list: ['*'],
        view: ['ADMIN', 'LECTURER'],
        edit: ['ADMIN'],
        delete: ['ADMIN']
      },
      myAccount: ['*'],
      settings: ['*'],
      users: {
        list: ['ADMIN'],
        view: ['*'],
        edit: ['ADMIN'],
        delete: ['ADMIN'],
        create: ['ADMIN']
      }
    }

})

app.config(function($stateProvider) {
    $stateProvider.state('base.activities', {
      template: '<div ui-view></div>'
    });
});

// Actitivities list
app.config(function($stateProvider, config) {
    $stateProvider.state('base.activities.list', {
        name: 'activities.list',
        url: '/activities/:course_id/:activity_id/:type?page&search',
        templateUrl: 'templates/activities-list.html',
        controller: 'ActivitiesListController',
        data: {
          authorizedRoles: config.authorizedRoles.activities.list
        },
        params:  {
          type: {
            value: null,
            squash: true
          },
          activity_id: {
            value: null,
            squash: true
          },
          course_id: {
            value: null,
            squash: true,
          }
        },
        resolve: {
            resolvedData: ["Activities", "Attendances", "Grades", "Files", "$http", "config", "$stateParams", "$rootScope", "$q", 'Courses', function(Activities, Attendances, Grades, Files, $http, config, $stateParams, $rootScope, $q, Courses) {
              var resource = null, role = null;
              var course_id = $stateParams.course_id !== null && $stateParams.course_id == parseInt($stateParams.course_id) ? parseInt($stateParams.course_id) : undefined;
              $stateParams.activity_id = course_id!==undefined ? $stateParams.activity_id : undefined;

              var id = $stateParams.activity_id !== null && $stateParams.activity_id == parseInt($stateParams.activity_id) ? parseInt($stateParams.activity_id) : undefined;
              // $stateParams.id = id;
              $stateParams.type = id!==undefined ? $stateParams.type : '';
              params = {
                'activity_id': id
              };
              switch($stateParams.type){
                case 'attendances':
                  resource = id === undefined ? Attendances.getAll : Attendances.getByActivityId;
                  role = 'attendances';
                  break;
                case 'grades':
                  resource = id === undefined ? Grades.getAll : Grades.getByActivityId;
                  role = 'grades';
                  break;
                case 'files':
                  resource = id === undefined ? Files.getAll : Files.getByActivityId;
                  role = 'files';
                  break;
                default:
                  resource = course_id === undefined ? Activities.getBasic : id === undefined ? Courses.getActivities : Activities.getByActivityId;
                  if (course_id !== undefined && id === undefined){
                    params.id = course_id;
                    delete params.activity_id;
                  }
                  role = 'activities';
                  break;
              }
              page = $stateParams.page ? parseInt($stateParams.page) : 0;
              search = $stateParams.search ? $stateParams.search : null;
              params.page = page;
              params.search = search;
              //In case of no parameters, return default view
              return resource(params).$promise.then(function(response){
                // Insert appropiate tag
                angular.forEach(response.content, function(value, key) {
                  if (!id){
                    value.activity = value;
                  } else{
                    value.tag = value.activity ? "tag-"+value.activity.type.name : '';
                    value.roleTag = "tag-"+value.role;
                    if (!value.role){
                      value.role = role.slice(0,-1);
                    }
                    if (value.student){
                      value.user = value.student;
                      delete value.student;
                    }
                  }
                });
                response.content.type = role;
                response.content.singleType = role == 'activities' ? false : true;
                response.pager.pages = new Array(response.pager.totalPages);
                //Return response
                if (course_id){
                  return Courses.getById({'id':course_id}).$promise.then(function(innerResponse){
                    if (id){
                      return Activities.getDetails({'id':id}).$promise.then(function(innerResponse2){
                        return {
                          activity: innerResponse2,
                          course: innerResponse,
                          activities: response.content,
                          pager: response.pager,
                          resource : resource,
                          role: role
                        };
                      }, function(innerResponse2){
                        // console.log(innerResponse2);
                        console.log(innerResponse2);
                        $rootScope.$broadcast("not-authorized");
                        return $q.reject("Rejection message!");
                      });
                    } else{
                      return {
                        activity: undefined,
                        course: innerResponse,
                        activities: response.content,
                        pager: response.pager,
                        resource : resource,
                        role: role
                      };
                    }
                  }, function(innerResponse){
                    // console.log(innerResponse);
                    console.log(innerResponse);
                    $rootScope.$broadcast("not-authorized");
                    return $q.reject("Rejection message!");
                  });
                } else{
                  return {
                    activity: undefined,
                    course: undefined,
                    activities: response.content,
                    pager: response.pager,
                    resource : resource,
                    role: role
                  };
                }
              }, function(response){
                // console.log(response);
                console.log(response);
                $rootScope.$broadcast("not-authorized");
                return $q.reject("Rejection message!");
              });
            }]
        }
    });
});

app.controller('ActivitiesListController', ['$scope', '$rootScope', 'resolvedData', '$state', "$stateParams", "Activities", "Attendances", "Grades", "Files", "AuthService", "Courses", "languageTranslator", "NotificationService", 'NOTIFICATIONS_TYPES',
        function($scope, $rootScope, resolvedData, $state, $stateParams, Activities, Attendances, Grades, Files, AuthService, Courses, languageTranslator, NotificationService, NOTIFICATIONS_TYPES) {
    //Init
    $scope.singleActivity = resolvedData.activity;
    $scope.singleCourse = resolvedData.course;
    $scope.activities = resolvedData.activities;
    $scope.pager = resolvedData.pager;
    // $scope.title = $scope.singleActivity.name ? [$scope.singleActivity.name,'/',$scope.activities.type].join(' ') : $scope.activities.type;
    $scope.title = $scope.singleActivity ? $scope.singleActivity.name : languageTranslator.pages.activities.title[$rootScope.language];
    $scope.subtitle = {
      text: $scope.singleActivity ? $scope.singleActivity.course.title : $scope.singleCourse ? $scope.singleCourse.title : languageTranslator.tables.allCourses[$rootScope.language],
      class: $scope.singleActivity || $scope.singleCourse ? 'td-blue' : ''
    }
    $scope.hasRole = AuthService.hasRole;

    $scope.labels = {
      placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders),
      table: $rootScope.getTranslatedObject(languageTranslator.tables),
      errors: $rootScope.getTranslatedObject(languageTranslator.errors),
      buttons: $rootScope.getTranslatedObject(languageTranslator.buttons),
      marked: languageTranslator.modals.addGrades.marked[$rootScope.language]
    }

    //Get specific page
    var previousType = null;
    $scope.pager.getPage = function(index){
      $stateParams.page = index;
      $state.go('base.activities.list', $stateParams, {reload: true});
    };
    $scope.goTo = function(activity){
      var params = {
        type: activity.role !== undefined ? activity.role+'s' : undefined,
        course_id: activity.activity.course.id,
        activity_id: activity.activity.id
      };
      if ($scope.singleActivity){
        params.user_id = activity.user.id;
        params.file_id = activity.extraId >= 0 ? activity.extraId : undefined;
        params.file_id = activity.id !== undefined ? activity.id : params.file_id;
        $state.go('base.activities.view', params, {reload: true});
      } else{
        params.page = 0;
        $state.go('base.activities.list', params, {reload: true});
      }
    };

    // Delete
    $scope.delete = function(params){
      var resource = null;
      var label = params.role.capitalizeFirstLetter();
      var requestBody = {};
      switch (params.role){
        case 'activity':
          resource = Activities;
          requestBody = {
            activity_id: params.activity.id
          };
          break;
        case 'attendance':
          resource = Attendances;
          requestBody = {
            activity_id: params.activity.id,
            student_id: params.user.id
          };
          break;
        case 'grade':
          resource = Grades;
          requestBody = {
            activity_id: params.activity.id,
            student_id: params.user.id
          };
          break;
      }
      //Removing activity
      resource.delete(requestBody).$promise.then(function(response){
        $state.go('base.activities.list', $stateParams, {reload: true});
        NotificationService.push({
          title: label+' Deleted',
          content: 'You have successfully deleted the '+label,
          link: null,
          type: NOTIFICATIONS_TYPES.success
        });
      }, function(response){
        console.log(response);
        NotificationService.push({
          title: label+' Not Deleted',
          content: 'An error has occured. The '+label+' hasn\'t been deleted.',
          link: null,
          type: NOTIFICATIONS_TYPES.error
        });
      });
    }

    // Search
    $scope.search = $rootScope.search;
    $scope.search.go = function(){
      $stateParams.page = 0;
      $stateParams.search = $scope.search.value;
      $state.go('base.activities.list', $stateParams, {reload: true});
    }
    document.getElementById("search-bar-input").addEventListener("keydown", function (e) {
      if (e.keyCode === 13) {
        $rootScope.search.go();
      }
    });

    //Courses
    $scope.selectedCourse = $scope.singleCourse;
    $scope.courses = undefined;
    if ($scope.singleActivity === undefined){
      Courses.getAllUnpaged().$promise.then(function(response){
        //Modify course titles
        angular.forEach(response, function(value, key) {
           value.title = [Array(value.year+1).join('I'),value.semester,' - ',value.title].join('');
        });
        response.sort( function(a,b) {return (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0);} );
        //Set courses
        $scope.courses = response;
      }, function(response){});
    };
    $scope.changeCourse = function(course){
      var params = {
        type: undefined,
        course_id: course,
        activity_id: undefined,
        page: 0
      };
      $state.go('base.activities.list', params, {reload: true});
    };

    //Buttons
    $scope.titleButton = {
      text: 'Add Activity'
    }

    //Modals
    $scope.modal = $rootScope.modal;

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': languageTranslator.pages.activities.title[$rootScope.language],
      'icon': null,
      'state': 'base.activities.list',
      'params': {
        'type': null,
        'course_id': null,
        'activity_id': null
      }
    };
    $rootScope.paths.length = 2;
    if ($scope.singleCourse){
      $rootScope.paths[2] = {
        'title': $scope.singleCourse.title,
        'icon': null,
        'state': 'base.activities.list',
        'params': {
          'type': null,
          'course_id': $scope.singleCourse.id,
          'activity_id': null,
        }
      };
      $rootScope.paths.length = 3;
      if ($scope.singleActivity){
        $rootScope.paths[3] = {
          'title': $scope.singleActivity.name,
          'icon': null,
          'state': 'base.activities.list',
          'params': {
            'type': null,
            'course_id': $scope.singleCourse.id,
            'activity_id': $scope.singleActivity.id
          }
        };
        $rootScope.paths.length = 4;
      }
      if($stateParams.type){
        $rootScope.paths[4] = {
          'title': languageTranslator.tables[$stateParams.type][$rootScope.language],
          'icon': null,
          'state': 'base.activities.list',
          'params': {
            'type': $stateParams.type,
            'course_id': $scope.singleCourse.id,
            'activity_id': $scope.singleActivity.id
          }
        };
        $rootScope.paths.length = 5;
      }
    }

    //Logic
    // console.log(resolvedData);
}]);

//Sub-Activities List
app.config(function($stateProvider, config) {
    $stateProvider.state('base.activities.sublist', {
        name: 'base.activities.sublist',
        url: '/activities/course/:course_id/:activity_id/:type?page',
        templateUrl: 'templates/activities-sublist.html',
        controller: 'ActivitiesSubListController',
        data: {
          authorizedRoles: config.authorizedRoles.activities.sublist
        },
        resolve: {
            resolvedData: ["Attendances", "Grades", "Files", "$http", "config", "$stateParams", "$rootScope", "$q", "Courses", function(Attendances, Grades, Files, $http, config, $stateParams, $rootScope, $q, Courses) {
              console.log($stateParams);
              return Courses.getById({
                id: $stateParams.course_id
              }).$promise.then(function(response){
                page = $stateParams.page ? parseInt($stateParams.page) : 0;
                return Courses.getActivities({'id':$stateParams.course_id, 'page':page}).$promise.then(function(innerResponse){
                  innerResponse.pager.pages = new Array(innerResponse.pager.totalPages > 0 ? innerResponse.pager.totalPages : 1);
                  return {
                    course: response,
                    activities: innerResponse.content,
                    pager: innerResponse.pager
                  };
                }, function(innerResponse){
                  $rootScope.$broadcast("not-authorized");
                  return $q.reject("Rejection message!");
                });
              }, function(response){});
            }]
        }
    });
});

app.controller('ActivitiesSubListController', ['$scope', '$rootScope', 'resolvedData', '$state', "$stateParams", function($scope, $rootScope, resolvedData, $state, $stateParams) {
    //Init
    $scope.course = resolvedData.course;
    $scope.activities = resolvedData.activities;
    $scope.pager = resolvedData.pager;
    $scope.title = $scope.course.title + ' - Activities';
    $scope.table = {
      showGrades : $scope.activities.type === 'grades'
    }

    $scope.update = function(index){
      if (!index){
        index = 0;
      }
      resolvedData.resource.getByActivityId({
        activity_id: $stateParams.activity_id,
        page: index
      }).$promise.then(function(response){
        response.content.type = $stateParams.type;
        response.content.activityId = $stateParams.activity_id;
        response.content.typeAll = false;
        response.pager.pages = new Array(response.pager.totalPages);
        //return
        $scope.activities = response.content;
        $scope.pager = response.pager;
        $scope.pager.getPage = function(index){
          $scope.refresh(index);
        };
      }, function(response){
        console.log(response);
      });
    }
    //Get specific page
    $scope.pager.getPage = function(index){
      $stateParams.page = index;
      $state.go('base.activities.sublist', $stateParams, {reload: true});
    };

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Activities',
      'icon': null,
      'state': 'base.activities.list',
      'params': null
    };
    $rootScope.paths[2] = {
      'title': $scope.course.title,
      'icon': null,
      'state': 'base.activities.sublist',
      'params': {
        course_id: $scope.course.id
      }
    };
    $rootScope.paths.length = 3;

    //Logic
    console.log(resolvedData);
}]);

//Activity detail view
app.config(function($stateProvider, config) {
    $stateProvider.state('base.activities.view', {
        name: 'base.activities.view',
        url: '/activities/:course_id/:activity_id/:type/:user_id/:file_id',
        templateUrl: 'templates/activities-view.html',
        controller: 'ActivitiesViewController',
        data: {
          authorizedRoles: config.authorizedRoles.activities.list
        },
        params:  {
          course_id: {
            value: null,
            squash: true
          },
          activity_id: {
            value: null,
            squash: true
          },
          type: {
            value: null,
            squash: true,
          },
          user_id: {
            value: null,
            squash: true,
          },
          file_id: {
            value: null,
            squash: true,
          }
        },
        resolve: {
            resolvedData: ["Attendances", "Grades", "Files", "$stateParams", "$rootScope", "$q", function(Attendances, Grades, Files, $stateParams, $rootScope, $q) {
              var resource;
              var params;
              switch($stateParams.type){
                case 'attendances':
                  resource = Attendances;
                  params = {
                    student_id: $stateParams.user_id,
                    activity_id: $stateParams.activity_id,
                  };
                  break;
                case 'grades':
                  resource = Grades;
                  params = {
                    student_id: $stateParams.user_id,
                    activity_id: $stateParams.activity_id,
                  };
                  break;
                case 'files':
                  resource = Files;
                  params = {
                    file_id: $stateParams.file_id,
                  };
                  break;
              }
              return resource.getById(params).$promise.then(function(response){
                response.type = $stateParams.type;
                response.user = response.student;
                response.user.type = 'student';
                response.user.tag = 'tag-'+response.user.type;
                delete response.student;
                return {
                  activity: response
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

app.controller('ActivitiesViewController', ['$scope', '$rootScope', 'resolvedData', 'config', 'languageTranslator', function($scope, $rootScope, resolvedData, config, languageTranslator) {
    //Init
    $scope.activity = resolvedData.activity;
    $scope.title = [$scope.activity.user.firstName,$scope.activity.user.lastName,'-',languageTranslator.tables[$scope.activity.type.slice(0,-1)][$rootScope.language],languageTranslator.tables.at[$rootScope.language],$scope.activity.activity.type.name,'(',$scope.activity.activity.course.title,')'].join(' ');

    $scope.labels = {
      placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders),
      table: $rootScope.getTranslatedObject(languageTranslator.tables),
      errors: $rootScope.getTranslatedObject(languageTranslator.errors),
      buttons: $rootScope.getTranslatedObject(languageTranslator.buttons),
      marked: languageTranslator.modals.addGrades.marked[$rootScope.language]
    }

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': 'Activities',
      'icon': null,
      'state': 'base.activities.list',
      'params': null
    };
    $rootScope.paths[2] = {
      'title': $scope.activity.type,
      'icon': null,
      'state': 'base.activities.list',
      'params': {
        type: $scope.activity.type
      }
    };
    $rootScope.paths[3] = {
      'title': $scope.activity.activity.name + " ("+$scope.activity.activity.course.title+")",
      'icon': null,
      'state': 'base.activities.sublist',
      'params': {
        type: $scope.activity.type,
        activity_id: $scope.activity.id.activityId
      }
    };

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': languageTranslator.pages.activities.title[$rootScope.language],
      'icon': null,
      'state': 'base.activities.list',
      'params': {
        'type': null,
        'course_id': null,
        'activity_id': null
      }
    };
    $rootScope.paths[2] = {
        'title': $scope.activity.activity.course.title,
        'icon': null,
        'state': 'base.activities.list',
        'params': {
          'type': null,
          'course_id': $scope.activity.activity.course.id,
          'activity_id': null,
        }
      };
    $rootScope.paths[3] = {
        'title': $scope.activity.activity.name,
        'icon': null,
        'state': 'base.activities.list',
        'params': {
          'type': null,
          'course_id': $scope.activity.activity.course.id,
          'activity_id': $scope.activity.activity.id
        }
      };
    $rootScope.paths[4] = {
        'title': languageTranslator.tables[$scope.activity.type][$rootScope.language],
        'icon': null,
        'state': 'base.activities.list',
        'params': {
          'type': $scope.activity.type,
          'course_id': $scope.activity.activity.course.id,
          'activity_id': $scope.activity.activity.id
        }
      };
    $rootScope.paths[5] = {
        'title': $scope.activity.user.firstName +' '+ $scope.activity.user.lastName,
        'icon': null,
        'state': 'base.activities.view',
        'params': {
          'type': $scope.activity.type,
          'course_id': $scope.activity.activity.course.id,
          'activity_id': $scope.activity.activity.id,
          'user_id': $scope.activity.user.id
        }
      };
    $rootScope.paths.length = 6;

    //Logic
    var orderedTitle = undefined;
    switch ($rootScope.language){
      case 'en':
        orderedTitle = [languageTranslator.tables[$scope.activity.type.slice(0,-1)][$rootScope.language],languageTranslator.tables.details[$rootScope.language]].join(' ');
        break;
      case 'ro':
        orderedTitle = [languageTranslator.tables.details[$rootScope.language], languageTranslator.tables[$scope.activity.type.slice(0,-1)][$rootScope.language]].join(' ');
        break;
    }
    $scope.table = {
      title : orderedTitle,
      columns : {
        user: $scope.activity.user.type.capitalizeFirstLetter(),
        activity: $scope.labels.table.activity,
        course: $scope.labels.table.course
      },
      retrieveLink : function(){
        return config.apiEndpoint+'storage/retrieve/'+$scope.activity.id+'?k='+$rootScope.authUser.token;
      },
      extraRows : []
    }

    switch($scope.activity.type){
      case 'attendances':
        break;
      case 'grades':
        $scope.table.extraRows = [{
            title : $scope.labels.table.value,
            value : $scope.activity.value,
            customClass : 'tag tag-auto tag-grade'
          }
        ]
        break;
      case 'files':
        $scope.table.extraRows = [{
            title : $scope.labels.table.file,
            value : $scope.activity.fileName+'.'+$scope.activity.extension,
            customClass : '',
            hasDownloadButton: true,
          },{
            title: $scope.labels.table.type,
            value : $scope.activity.extension,
            customClass : 'tag tag-auto tag-file'
          },{
            title: $scope.labels.table.uploadDate,
            value : $scope.activity.uploadDate,
            customClass : 'td-blue'
          }
        ]
        break;
    }
}]);

app.config(function($stateProvider) {
    $stateProvider.state('base.courses', {
      template: '<div ui-view></div>'
    });
});

// Courses list
app.config(function($stateProvider, config) {
    $stateProvider.state('base.courses.list', {
        name: 'base.courses.list',
        url: '/courses?page&search',
        templateUrl: 'templates/courses-list.html',
        controller: 'CoursesListController',
        data: {
          authorizedRoles: config.authorizedRoles.courses.list
        },
        resolve: {
            resolvedData: ["Courses", "$http", "config", "$rootScope", "$q", "$stateParams", function(Courses, $http, config, $rootScope, $q, $stateParams) {
              search = $stateParams.search ? $stateParams.search : null;
              page = $stateParams.page ? parseInt($stateParams.page) : 0;
              return Courses.getAll({'page':page, 'search':search}).$promise.then(function(response){
                console.log(response);
                response.pager.pages = new Array(response.pager.totalPages);
                return {
                  courses: response.content,
                  pager: response.pager
                };
              },function(response){
                console.log(response);
                $rootScope.$broadcast("not-authorized");
                return $q.reject("Rejection message!");
              });
            }]
        }
    });
});

app.controller('CoursesListController', ['$scope', '$rootScope', 'resolvedData', '$state', 'Courses', '$stateParams','languageTranslator', function($scope, $rootScope, resolvedData, $state, Courses, $stateParams, languageTranslator) {
    //Init
    $scope.title = languageTranslator.tables.courses[$rootScope.language];
    $scope.courses = resolvedData.courses;
    $scope.pager = resolvedData.pager;

    $scope.pager.getPage = function(index){
      $stateParams.page = index;
      $state.go('base.courses.list', $stateParams, {reload: true});
    };

    // Search
    $scope.search = $rootScope.search;
    $scope.search.go = function(){
      $stateParams.page = 0;
      $stateParams.search = $scope.search.value;
      $state.go('base.courses.list', $stateParams, {reload: true});
    }
    document.getElementById("search-bar-input").addEventListener("keydown", function (e) {
      if (e.keyCode === 13) {
        $rootScope.search.go();
      }
    });

    $scope.labels = {
      placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders),
      table: $rootScope.getTranslatedObject(languageTranslator.tables),
      errors: $rootScope.getTranslatedObject(languageTranslator.errors),
      buttons: $rootScope.getTranslatedObject(languageTranslator.buttons),
      marked: languageTranslator.modals.addGrades.marked[$rootScope.language]
    };

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': languageTranslator.tables.courses[$rootScope.language],
      'icon': null,
      'state': 'base.courses.list',
      'params': null
    };
    $rootScope.paths.length = 2;
}]);

//Course view
app.config(function($stateProvider, config) {
    $stateProvider.state('base.courses.view', {
        name: 'base.courses.view',
        url: '/courses/:id/:detail?page',
        templateUrl: 'templates/courses-view.html',
        controller: 'CoursesViewController',
        data: {
          authorizedRoles: config.authorizedRoles.courses.view
        },
        resolve: {
            resolvedData: ["Courses", "$stateParams", "$q", "$rootScope", function(Courses, $stateParams, $q, $rootScope) {
              return Courses.getById({
                id: $stateParams.id
              }).$promise.then(function(response){
                response.detail = 'overview';
                if ($stateParams.detail){
                  page = $stateParams.page ? parseInt($stateParams.page) : 0;
                  response.detail = $stateParams.detail;
                  response.hasLecturers = $stateParams.detail === 'lecturers' ? true : false;
                  response.hasStudents = $stateParams.detail === 'students' ? true : false;
                  response.hasActivities = $stateParams.detail === 'activities' ? true : false;
                  switch($stateParams.detail){
                    case 'lecturers':
                      return Courses.getLecturers({'id':$stateParams.id, 'page':page}).$promise.then(function(innerResponse){
                        response.lecturers = innerResponse.content;
                        innerResponse.pager.pages = new Array(innerResponse.pager.totalPages > 0 ? innerResponse.pager.totalPages : 1);
                        return {
                          course: response,
                          pager: innerResponse.pager
                        };
                      }, function(innerResponse){});
                    case 'students':
                      return Courses.getStudents({'id':$stateParams.id, 'page':page}).$promise.then(function(innerResponse){
                        response.students = innerResponse.content;
                        innerResponse.pager.pages = new Array(innerResponse.pager.totalPages > 0 ? innerResponse.pager.totalPages : 1);
                        return {
                          course: response,
                          pager: innerResponse.pager
                        };
                      }, function(innerResponse){});
                    case 'activities':
                      return Courses.getActivities({'id':$stateParams.id, 'page':page}).$promise.then(function(innerResponse){
                        response.activities = innerResponse.content;
                        innerResponse.pager.pages = new Array(innerResponse.pager.totalPages > 0 ? innerResponse.pager.totalPages : 1);
                        return {
                          course: response,
                          pager: innerResponse.pager
                        };
                      }, function(innerResponse){});
                    default:
                      break;
                  }
                }
                //Else
                return {
                  course: response
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

app.controller('CoursesViewController', ['$scope', '$rootScope', 'resolvedData', '$stateParams', '$state', 'languageTranslator', function($scope, $rootScope, resolvedData, $stateParams, $state, languageTranslator) {
    //Init
    $scope.course = resolvedData.course;
    $scope.pager = resolvedData.pager ? resolvedData.pager : {};
    $scope.pager.getPage = function(index){
      $stateParams.page = index;
      $state.go('base.courses.view', $stateParams, {reload: true});
    };
    $scope.title = $scope.course.title;
    $scope.authUser = $rootScope.authUser.user;

    console.log($scope.course.activities);

    $scope.labels = {
      placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders),
      table: $rootScope.getTranslatedObject(languageTranslator.tables),
      errors: $rootScope.getTranslatedObject(languageTranslator.errors),
      buttons: $rootScope.getTranslatedObject(languageTranslator.buttons),
      marked: languageTranslator.modals.addGrades.marked[$rootScope.language]
    };


    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': languageTranslator.tables.courses[$rootScope.language],
      'icon': null,
      'state': 'base.courses.list',
      'params': null
    };
    $rootScope.paths[2] = {
      'title': $scope.course.title,
      'icon': null,
      'state': 'base.courses.view',
      'params': {
        id: $scope.course.id,
        detail: null
      }
    };
    $rootScope.paths.length = 3;
    if ($stateParams.detail){
      $scope.title = [$scope.course.title,"-", $stateParams.detail].join(" ");
      $rootScope.paths[3] = {
        'title':  $stateParams.detail,
        'icon': null,
        'state': 'base.courses.view',
        'params': {
          id: $scope.course.id,
          detail: $stateParams.detail
        }
      };
      $rootScope.paths.length = 4;
    }
}]);

app.config(function($stateProvider, config) {
    $stateProvider.state('base.dashboard', {
        url: '/dashboard',
        templateUrl: 'templates/dashboard.html',
        controller: 'DashboardController',
        data: {
          authorizedRoles: config.authorizedRoles.dashboard.view
        },
        resolve: {
            resolvedData: ["Activities", "Files", "Courses", "$http", "config", "$stateParams", "$rootScope", "$q",
              function(Activities, Files, Courses, $http, config, $stateParams, $rootScope, $q) {
                return $q.all([
                  Activities.getAll().$promise,
                  Courses.getAll().$promise,
                  Files.getAll().$promise
                ]).then(function(response){
                  angular.forEach(response[0].content, function(activity, key){
                    activity.roleTag = ['tag',activity.role].join('-');
                    activity.activity.type.name = activity.activity.type.name[0];
                  });
                  angular.forEach(response[2].content, function(file, key){
                    file.activity.type.name = file.activity.type.name[0];
                  });
                  return {
                    'activities': response[0].content.slice(0,6),
                    'courses': response[1].content.slice(0,6),
                    'files': response[2].content.slice(0,6)
                  };
                }, function(error){
                  return error;
                });
            }]
        }
    });
});

app.controller('DashboardController', ['$scope','$rootScope','AuthService','config', 'resolvedData', 'languageTranslator', function($scope, $rootScope, AuthService, config, resolvedData, languageTranslator) {
    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': languageTranslator.menu.dashboard[$rootScope.language],
      'icon': null,
      'state': 'dashboard',
      'params': null
    };

    //Logic
    $scope.title = languageTranslator.menu.dashboard[$rootScope.language];
    $scope.isAuthorized = AuthService.isAuthorized;
    $scope.hasRole = AuthService.hasRole;
    $scope.authorizedRoles = config.authorizedRoles;
    $scope.user = $rootScope.authUser.user;

    //Parsing resolved data
    $scope.activities = resolvedData.activities;
    $scope.courses = resolvedData.courses;
    $scope.files = resolvedData.files;

    //Labels
    $scope.dashboardLabels = $rootScope.getTranslatedObject(languageTranslator.pages.dashboard);
    $scope.dashboardLabels.tables = $rootScope.getTranslatedObject(languageTranslator.tables);
    $scope.dashboardLabels.errors = $rootScope.getTranslatedObject(languageTranslator.errors);
}]);

app.config(function($stateProvider) {
    $stateProvider.state('base.groups', {
      template: '<div ui-view></div>'
    });
});

// Group list
app.config(function($stateProvider, config) {
    $stateProvider.state('base.groups.list', {
        name: 'base.groups.list',
        url: '/groups?page&search',
        templateUrl: 'templates/groups-list.html',
        controller: 'GroupsListController',
        data: {
          authorizedRoles: config.authorizedRoles.groups.list
        },
        resolve: {
            resolvedData: ["Groups", "$http", "config", "$rootScope", "$q", "$stateParams", function(Groups, $http, config, $rootScope, $q, $stateParams) {
              search = $stateParams.search ? $stateParams.search : null;
              page = $stateParams.page ? parseInt($stateParams.page) : 0;
              return Groups.getAll({'page':page, 'search':search}).$promise.then(function(response){
                response.pager.pages = new Array(response.pager.totalPages);
                return {
                  groups: response.content,
                  pager: response.pager
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

app.controller('GroupsListController', ['$scope', '$rootScope', 'resolvedData', '$state', 'Groups', '$stateParams', 'languageTranslator', function($scope, $rootScope, resolvedData, $state, Groups, $stateParams, languageTranslator) {
    //Init
    $scope.title = languageTranslator.tables.groups[$rootScope.language];
    $scope.groups = resolvedData.groups;
    $scope.pager = resolvedData.pager;

    $scope.labels = {
      placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders),
      table: $rootScope.getTranslatedObject(languageTranslator.tables),
      errors: $rootScope.getTranslatedObject(languageTranslator.errors),
      buttons: $rootScope.getTranslatedObject(languageTranslator.buttons)
    };

    $scope.pager.getPage = function(index){
      $stateParams.page = index;
      $state.go('base.groups.list', $stateParams, {reload: true});
    };

    // Search
    $scope.search = $rootScope.search;
    $scope.search.go = function(){
      $stateParams.page = 0;
      $stateParams.search = $scope.search.value;
      $state.go('base.groups.list', $stateParams, {reload: true});
    }
    document.getElementById("search-bar-input").addEventListener("keydown", function (e) {
      if (e.keyCode === 13) {
        $rootScope.search.go();
      }
    });

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': languageTranslator.tables.groups[$rootScope.language],
      'icon': null,
      'state': 'base.groups.list',
      'params': null
    };
    $rootScope.paths.length = 2;
}]);

//Group view
app.config(function($stateProvider, config) {
    $stateProvider.state('base.groups.view', {
        name: 'base.groups.view',
        url: '/groups/:id',
        templateUrl: 'templates/groups-view.html',
        controller: 'GroupsViewController',
        data: {
          authorizedRoles: config.authorizedRoles.groups.view
        },
        resolve: {
            resolvedData: ["Groups", "$stateParams", "$rootScope", "$q", function(Groups, $stateParams, $rootScope, $q) {
              return Groups.getById({
                id: $stateParams.id
              }).$promise.then(function(response){
                return {
                  group: response
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

app.controller('GroupsViewController', ['$scope', '$rootScope', 'resolvedData', 'languageTranslator', function($scope, $rootScope, resolvedData, languageTranslator) {
    //Init
    $scope.group = resolvedData.group;
    $scope.title = [languageTranslator.tables.group[$rootScope.language],$scope.group.name].join(' ');

    $scope.labels = {
      placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders),
      table: $rootScope.getTranslatedObject(languageTranslator.tables),
      errors: $rootScope.getTranslatedObject(languageTranslator.errors),
      buttons: $rootScope.getTranslatedObject(languageTranslator.buttons)
    };

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': languageTranslator.tables.groups[$rootScope.language],
      'icon': null,
      'state': 'base.groups.list',
      'params': null
    };
    $rootScope.paths[2] = {
      'title': $scope.group.name,
      'icon': null,
      'state': 'base.groups.view',
      'params': {
        id: $scope.group.id
      }
    };
    $rootScope.paths.length = 3;
}]);

app.config(function($stateProvider) {
    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'LoginController',
    });
});

app.controller('LoginController', ['$scope', '$q','$state', '$timeout', 'AuthService', 'config', '$rootScope', 'NOTIFICATIONS_TYPES', 'NotificationService', 'languageTranslator',
      function($scope, $q, $state, $timeout, AuthService, config, $rootScope, NOTIFICATIONS_TYPES, NotificationService, languageTranslator) {
    $scope.title = 'Login';
    $scope.form = {
      loading: false,
      email: null,
      password: null,
      errors : null,
      submit: function(){
        $scope.form.loading = true;
        $scope.form.errors = null;
        //Artificial delay
        $timeout(function(){
          AuthService.login({
            "email": $scope.form.email,
            "password": $scope.form.password
          }).then(function(response){
            // NotificationService.push({
            //   title: 'Logged in',
            //   content: 'You have successfully logged in your account.',
            //   link: null,
            //   type: NOTIFICATIONS_TYPES.success
            // });
          }, function(response){
            $scope.form.loading = false;
            if (response == null){
              NotificationService.push({
                title: languageTranslator.pages.login.notificationError.title[$rootScope.language],
                content: languageTranslator.pages.login.notificationError.content[$rootScope.language],
                link: null,
                type: NOTIFICATIONS_TYPES.error
              });
            } else{
              $scope.form.errors = response.errors ? response.errors : null;
            }
          });
        }, config.preloader.artificialTime);
      }
    };

    $scope.labels = {
      login: $rootScope.getTranslatedObject(languageTranslator.pages.login),
      table: $rootScope.getTranslatedObject(languageTranslator.tables),
      errors: $rootScope.getTranslatedObject(languageTranslator.errors),
      placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders)
    };

    //Notifications wrapper
    $scope.notifications = $rootScope.notifications;
    //Notifications listener
    $scope.$on('not-authenticated', function (event, data) {
      NotificationService.push({
        title: 'Not authorized',
        content: 'You are not allowed to view the requested resource.',
        link: null,
        type: NOTIFICATIONS_TYPES.error
      });
    });

}]);

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

app.config(function($stateProvider) {
    $stateProvider.state('base.users', {
      template: '<div ui-view></div>'
    });
});

// Users List
app.config(function($stateProvider, config) {
    $stateProvider.state('base.users.list', {
        url: '/users/:type',
        templateUrl: 'templates/users-list.html',
        controller: 'UsersListController',
        data: {
          authorizedRoles: config.authorizedRoles.users.list
        },
        params:  {
          type: {
            value: null,
            squash: true
          }
        },
        resolve: {
            resolvedData: ["Users", "Students", "Lecturers", "Admins", "$http", "config", "$stateParams", "$q", "$rootScope", function(Users, Students, Lecturers, Admins, $http, config, $stateParams, $q, $rootScope) {
              var resource = null, role = true;
              switch($stateParams.type){
                case 'students':
                  resource = Students;
                  role = 'students';
                  break;
                case 'lecturers':
                  resource = Lecturers;
                  role = 'lecturers';
                  break;
                case 'admins':
                  resource = Admins;
                  role = 'admins';
                  break;
                default:
                  resource = Users;
                  role = 'users';
                  break;
              }
              return resource.getAll().$promise.then(function(response){
                //Insert appropiate tag
                angular.forEach(response.content, function(value, key) {
                  value.tag = "tag-"+value.type;
                  if (!value.type){
                    value.type = role.slice(0,-1);
                  }
                });
                response.content.type = role;
                response.content.singleType = role == 'users' ? false : true;
                response.pager.pages = new Array(response.pager.totalPages > 0 ? response.pager.totalPages : 1);
                //Return modified response
                return {
                  users: response.content,
                  pager: response.pager,
                  resource: resource,
                  role: role
                };
              }, function(response){
                console.log(response);
                switch (response.status){
                  case 403:
                    $rootScope.$broadcast("not-authorized");
                  case 404:
                    $rootScope.$broadcast("not-found");
                  default:
                    $rootScope.$broadcast("unknown-error");
                }
                return $q.reject("Rejection message!");
              });
            }]
        }
    });
});

app.controller('UsersListController', ['$scope', '$rootScope', '$stateParams', 'config', 'resolvedData', 'Users', 'Students','Lecturers','Admins', 'languageTranslator',
          function($scope, $rootScope, $stateParams, config, resolvedData, Users, Students, Lecturers, Admins, languageTranslator) {
    //Init
    $scope.title = $stateParams.type ? $stateParams.type : languageTranslator.tables.users[$rootScope.language];
    $scope.users = resolvedData.users;
    $scope.pager = resolvedData.pager;

    $scope.labels = {
      placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders),
      table: $rootScope.getTranslatedObject(languageTranslator.tables),
      errors: $rootScope.getTranslatedObject(languageTranslator.errors),
      buttons: $rootScope.getTranslatedObject(languageTranslator.buttons)
    };

    $scope.refresh = function(index){
      if (!index){
        index = 0;
      }
      var resource = resolvedData.resource, role = resolvedData.role;
      resource.getAll({
        'page':index,
        'search': $scope.search.value
      }).$promise.then(function(response){
        //Insert appropiate tag
        angular.forEach(response.content, function(value, key) {
          value.tag = "tag-"+value.type;
          if (!value.type){
            value.type = role.slice(0,-1);
          }
        });
        response.content.type = role;
        response.content.singleType = role == 'users' ? false : true;
        response.pager.pages = new Array(response.pager.totalPages > 0 ? response.pager.totalPages : 1);
        //Return modified response
        $scope.users = response.content;
        $scope.pager = response.pager;
        $scope.pager.getPage = function(index){
          $scope.refresh(index);
        };
      });
    }
    //Get specific page
    $scope.pager.getPage = function(index){
      $scope.refresh(index);
    };

    $scope.search = $rootScope.search;
    $scope.search.go = function(){
      $scope.refresh();
    }
    document.getElementById("search-bar-input").addEventListener("keydown", function (e) {
      if (e.keyCode === 13) {
        $rootScope.search.go();
      }
    });

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': languageTranslator.tables.users[$rootScope.language],
      'icon': null,
      'state': 'base.users.list',
      'params': null
    };
    $rootScope.paths.length = 2;
    if ($stateParams.type){
      $rootScope.paths[2] = {
        'title': languageTranslator.tables[$stateParams.type][$rootScope.language],
        'icon': null,
        'state': 'base.users.list',
        'params': {
          'type': $stateParams.type
        }
      };
      $rootScope.paths.length = 3;
    }

    console.log($scope.users);

    $scope.filters = {
      toggleFilters : undefined,
      isTypeShown : undefined,
      students : {
        visibility: true
      },
      lecturers : {
        visibility: true
      },
      admins : {
        visibility: true
      }
    }
    $scope.filters.toggleFilters = function(){
      console.log($scope.filters);
    }
    $scope.filters.isTypeShown = function(type){
      switch(type){
        case 'student':
          return $scope.filters.students.visibility;
        case 'lecturer':
          return $scope.filters.lecturers.visibility;
        case 'admin':
          return $scope.filters.admins.visibility;
      }
    }

}]);

//Users view
app.config(function($stateProvider, config) {
    $stateProvider.state('base.users.view', {
        url: '/users/:type/:id/:detail?page',
        templateUrl: 'templates/users-view.html',
        controller: 'UsersViewController',
        data: {
          authorizedRoles: config.authorizedRoles.users.view
        },
        resolve: {
            resolvedData: ["Students", "Lecturers", "Admins", "$stateParams", "$q", "$rootScope", function(Students, Lecturers, Admins, $stateParams, $q, $rootScope) {
              var resource;
              switch($stateParams.type){
                case 'students':
                  resource = Students;
                  break;
                case 'lecturers':
                  resource = Lecturers;
                  break;
                case 'admins':
                  resource = Admins;
                  break;
              }
              return resource.getById({
                id: $stateParams.id
              }).$promise.then(function(response){
                response.hasGroups = $stateParams.type == 'students' ? true : false;
                response.hasCourses = $stateParams.type == 'students' || $stateParams.type == 'lecturers' ? true : false;
                response.hasAttendances = $stateParams.type == 'students' ? true : false;
                response.hasGrades = $stateParams.type == 'students' ? true : false;
                response.hasFiles = $stateParams.type == 'students' ? true : false;
                angular.forEach(response.attendances, function(value, key) {
                  value.activity.type.tag = value.activity.type.name.substring(0,1);
                });
                angular.forEach(response.grades, function(value, key) {
                  value.activity.type.tag = value.activity.type.name.substring(0,1);
                });
                //Make detail call
                var content = null;
                response.detail = 'overview';
                if ($stateParams.detail){
                  var detailResource = resource;
                  response.hasAttendances = $stateParams.detail === 'attendances' ? true : false;
                  response.hasGrades = $stateParams.detail === 'grades' ? true : false;
                  response.hasFiles = $stateParams.detail === 'files' ? true : false;
                  response.hasGroups = $stateParams.detail === 'groups' ? true : false;
                  response.hasCourses = $stateParams.detail === 'courses' ? true : false;
                  response.detail = $stateParams.detail;
                  page = $stateParams.page ? parseInt($stateParams.page) : 0;
                  switch($stateParams.detail){
                    case 'attendances':
                      return detailResource.getAttendances({'id':$stateParams.id, 'page':page}).$promise.then(function(innerResponse){
                        response.attendances = innerResponse.content;
                        innerResponse.pager.pages = new Array(innerResponse.pager.totalPages > 0 ? innerResponse.pager.totalPages : 1);
                        return {
                          user: response,
                          pager: innerResponse.pager
                        };
                      }, function(innerResponse){});
                      break;
                    case 'grades':
                      return detailResource.getGrades({'id':$stateParams.id, 'page':page}).$promise.then(function(innerResponse){
                        response.attendances = innerResponse.content;
                        innerResponse.pager.pages = new Array(innerResponse.pager.totalPages > 0 ? innerResponse.pager.totalPages : 1);
                        return {
                          user: response,
                          pager: innerResponse.pager
                        };
                      }, function(innerResponse){});
                      break;
                    case 'files':
                      return detailResource.getFiles({'id':$stateParams.id, 'page':page}).$promise.then(function(innerResponse){
                        response.attendances = innerResponse.content;
                        innerResponse.pager.pages = new Array(innerResponse.pager.totalPages > 0 ? innerResponse.pager.totalPages : 1);
                        return {
                          user: response,
                          pager: innerResponse.pager
                        };
                      }, function(innerResponse){});
                      break;
                    case 'groups':
                      return detailResource.getGroups({'id':$stateParams.id, 'page':page}).$promise.then(function(innerResponse){
                        response.attendances = innerResponse.content;
                        innerResponse.pager.pages = new Array(innerResponse.pager.totalPages > 0 ? innerResponse.pager.totalPages : 1);
                        return {
                          user: response,
                          pager: innerResponse.pager
                        };
                      }, function(innerResponse){});
                      break;
                    case 'courses':
                      return detailResource.getCourses({'id':$stateParams.id, 'page':page}).$promise.then(function(innerResponse){
                        response.attendances = innerResponse.content;
                        innerResponse.pager.pages = new Array(innerResponse.pager.totalPages > 0 ? innerResponse.pager.totalPages : 1);
                        return {
                          user: response,
                          pager: innerResponse.pager
                        };
                      }, function(innerResponse){});
                      break;
                    default:
                      break;
                  }
                  //detail resource return error
                }
                else {
                  return {
                    user: response
                  };
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

app.controller('UsersViewController', ['$scope', '$rootScope', '$stateParams', 'Students', 'Groups', 'resolvedData', '$stateParams', '$state', 'languageTranslator',
          function($scope, $rootScope, $stateParams, Students, Groups, resolvedData, $stateParams, $state, languageTranslator) {
    //Init
    $scope.user = resolvedData.user;
    $scope.pager = resolvedData.pager ? resolvedData.pager : {};
    $scope.pager.getPage = function(index){
      $stateParams.page = index;
      $state.go('base.users.view', $stateParams, {reload: true});
    };

    $scope.labels = {
      placeholders: $rootScope.getTranslatedObject(languageTranslator.modals.placeholders),
      table: $rootScope.getTranslatedObject(languageTranslator.tables),
      errors: $rootScope.getTranslatedObject(languageTranslator.errors),
      buttons: $rootScope.getTranslatedObject(languageTranslator.buttons)
    };

    $scope.user.type = $stateParams.type;
    $scope.user.tag = 'tag-'+$scope.user.type.slice(0,-1);
    $scope.user.tag = {
      name: $stateParams.type.slice(0,-1),
      class: 'tag-'+$stateParams.type.slice(0,-1)
    }
    $scope.title = $scope.user.lastName + " " + $scope.user.firstName;

    //Add path to breadcrums list
    $rootScope.paths[1] = {
      'title': languageTranslator.tables.users[$rootScope.language],
      'icon': null,
      'state': 'base.users.list',
      'params': null
    };
    $rootScope.paths[2] = {
      'title':  languageTranslator.tables[$scope.user.type][$rootScope.language],
      'icon': null,
      'state': 'base.users.list',
      'params': {
        type: $scope.user.type
      }
    };
    $rootScope.paths[3] = {
      'title':  $scope.user.lastName + " " + $scope.user.firstName,
      'icon': null,
      'state': 'base.users.view',
      'params': {
        type: $scope.user.type,
        id: $scope.user.id,
        detail: null
      }
    };
    $rootScope.paths.length = 4;
    if ($stateParams.detail){
      $scope.title = [$scope.user.lastName, $scope.user.firstName,"-", $stateParams.detail].join(" ");
      $rootScope.paths[4] = {
        'title':  $stateParams.detail,
        'icon': null,
        'state': 'base.users.view',
        'params': {
          type: $scope.user.type,
          id: $scope.user.id,
          detail: $stateParams.detail
        }
      };
      $rootScope.paths.length = 5;
    }

    $scope.settings = {
      'editButtons' : false
    }

    console.log($scope.modal);

    $scope.modalOld = {
      element: $('#add-group-modal'),
      user: {},
      open: undefined,
      submit: undefined
    }

    $scope.modalOld.open = function(){
      // Get groups
      Groups.getAll().$promise.then(function(response){
        $scope.modalOld.groups = [];
        //Show only appropiate groups
        angular.forEach(response, function(group, key) {
          var hasGroup = false;
          angular.forEach(group.students, function(student, key){
            if ($scope.user.id === student.id){
              hasGroup = true;
            }
          });
          if (!hasGroup){
            $scope.modalOld.groups.push(group);
          }
        });
      }, function(response){
        // console.log(response);
      });
    }

    $scope.modalOld.submit = function(){
      if ($stateParams.type === 'students'){
        Students.addGroup({
          id: $scope.user.id
        }, $scope.modalOld.user.group).$promise.then(function(response){
          console.log(response);
        }, function(response){
          console.log(response);
        });

      }
      $scope.modalOld.element.modal('hide');
    }

}]);

app.directive('preloader', function() {
  return {
    restrict: 'E',
    replace: true,
    template: '<section class="preloader"><section class="p-boxes-wrapper"><figure class="p-box"></figure><figure class="p-box"></figure><figure class="p-box"></figure></section><section class="logo-wrapper hide"><figure class="logo"></figure></section></section>',
  };
});

app.constant("languageTranslator", {
  languages: ['en', 'ro'],

  menu: {
    dashboard: {
      "en": 'Dashboard',
      "ro": 'Tablou de bord'
    },
    activities: {
      "en": 'Activities',
      "ro": 'Activități'
    },
    courses: {
      "en": 'Courses',
      "ro": 'Cursuri'
    },
    groups: {
      "en": 'Groups',
      "ro": 'Grupe'
    },
    users: {
      "en": 'Users',
      "ro": 'Utilizatori'
    },
    settings: {
      "en": 'Settings',
      "ro": 'Setări'
    },
    logout: {
      "en": 'Logout',
      "ro": 'Delogare'
    },
    management: {
      "en": 'Management',
      "ro": 'Administrativ'
    },
    account: {
      "en": 'Account',
      "ro": 'Cont'
    }
  },

  tables: {
    viewAll: {
      "en": 'View All',
      "ro": 'Vizualizare'
    },
    activity: {
      "en": 'Activity',
      "ro": 'Activitate'
    },
    activities: {
      "en": 'Activities',
      "ro": 'Activități'
    },
    course: {
      "en": 'Course',
      "ro": 'Curs'
    },
    courses: {
      "en": 'Courses',
      "ro": 'Cursuri'
    },
    group: {
      "en": 'Group',
      "ro": 'Grupă'
    },
    groups: {
      "en": 'Groups',
      "ro": 'Grupe'
    },
    allCourses: {
      "en": 'All courses',
      "ro": 'Toate cursurile'
    },
    type: {
      "en": 'Type',
      "ro": 'Tip'
    },
    name: {
      "en": 'Name',
      "ro": 'Nume'
    },
    firstName: {
      "en": 'First Name',
      "ro": 'Prenume'
    },
    lastName: {
      "en": 'Last Name',
      "ro": 'Nume'
    },
    email: {
      "en": 'Email',
      "ro": 'Email'
    },
    password: {
      "en": 'Password',
      "ro": 'Parolă'
    },
    rpassword: {
      "en": 'Repeat Password',
      "ro": 'Repetă Parola'
    },
    date: {
      "en": 'Date',
      "ro": 'Dată'
    },
    allActivities: {
      "en": 'All Activities',
      "ro": 'Toate Activitățile'
    },
    allGroups: {
      "en": 'All Groups',
      "ro": 'Toate Grupele'
    },
    search: {
      "en": 'Search',
      "ro": 'Caută'
    },
    role: {
      "en": 'Role',
      "ro": 'Rol'
    },
    activityDate: {
      "en": 'Activity Date',
      "ro": 'Data Activității'
    },
    uploadDate: {
      "en": 'Upload Date',
      "ro": 'Data Încărcării'
    },
    title: {
      "en": 'Title',
      "ro": 'Titlu'
    },
    year: {
      "en": 'Year',
      "ro": 'An'
    },
    semester: {
      "en": 'Semester',
      "ro": 'Semestru'
    },
    student: {
      "en": 'Student',
      "ro": 'Student',
    },
    students: {
      "en": 'Students',
      "ro": 'Studenți'
    },
    lecturer: {
      "en": 'Lecturer',
      "ro": 'Profesor'
    },
    lecturers: {
      "en": 'Lecturers',
      "ro": 'Profesori'
    },
    admin: {
      "en": 'Admin',
      "ro": 'Admin'
    },
    admins: {
      "en": 'Admins',
      "ro": 'Administratori'
    },
    user: {
      "en": 'User',
      "ro": 'Utilizator'
    },
    users: {
      "en": 'Users',
      "ro": 'Utilizatori'
    },
    allUsers: {
      "en": 'All Users',
      "ro": 'Toți Utilizatorii'
    },
    tools: {
      "en": 'Tools',
      "ro": 'Unelte'
    },
    actions: {
      "en": 'Actions',
      "ro": 'Acțiuni'
    },
    filterByCourse: {
      "en": 'Filter by course',
      "ro": 'Filtrează dupa curs'
    },
    attendance: {
      "en": 'Attendance',
      "ro": 'Prezența'
    },
    attendances: {
      "en": 'Attendances',
      "ro": 'Prezențe'
    },
    grade: {
      "en": 'Grade',
      "ro": 'Notă'
    },
    grades: {
      "en": 'Grades',
      "ro": 'Note'
    },
    file: {
      "en": 'File',
      "ro": 'Fișier'
    },
    files: {
      "en": 'Files',
      "ro": 'Fișiere'
    },
    details: {
      "en": 'Details',
      "ro": 'Detalii'
    },
    value: {
      "en": 'Value',
      "ro": 'Valoare'
    },
    overview: {
      "en": 'Overview',
      "ro": 'General'
    },
    at: {
      "en": 'at',
      "ro": 'la'
    }
  },

  buttons: {
    cancel: {
      "en": 'Cancel',
      "ro": 'Anulează'
    },
    next: {
      "en": 'Next',
      "ro": 'Continuă'
    },
    back: {
      "en": 'Back',
      "ro": 'Înapoi'
    },
    save: {
      "en": 'Save',
      "ro": 'Salvează'
    },
    addActivity: {
      "en": 'Add Activity',
      "ro": 'Adaugă Activitate'
    },
    markAttendances: {
      "en": 'Mark Attendances',
      "ro": 'Adaugă Prezențe'
    },
    addGrades: {
      "en": 'Add Grades',
      "ro": 'Adaugă Note'
    },
    uploadFile: {
      "en": 'Upload File',
      "ro": 'Încarcă Fișier'
    },
    addCourse: {
      "en": 'Add Course',
      "ro": 'Adaugă Curs'
    },
    addLecturerToCourse: {
      "en": 'Add Lecturer to Course',
      "ro": 'Adaugă Profesor la Curs'
    },
    addStudentsToCourse: {
      "en": 'Add Students to Course',
      "ro": 'Adaugă Studenți la Curs'
    },
    addGroup: {
      "en": 'Add Group',
      "ro": 'Adaugă Grupă'
    },
    addUser: {
      "en": 'Add User',
      "ro": 'Adaugă Utilizator'
    },
    logout: {
      "en": 'Logout',
      "ro": 'Delogare'
    },
    delete: {
      "en": 'Delete',
      "ro": 'Șterge'
    }
  },

  modals: {
    logout: {
      'title': {
        "en": 'Logout confirmation',
        "ro": 'Confirmare delogare'
      }
    },
    delete: {
      'title': {
        "en": 'Are you sure?',
        "ro": 'Sunteți sigur?'
      }
    },
    addActivity: {
      title: {
        "en": 'Add Activity',
        "ro": 'Adaugă Activitate'
      },
      loading: {
        "en": 'Saving Activity',
        "ro": 'Salvare Activitate'
      },
      notificationSuccess: {
        title: {
          "en": 'Activity Created',
          "ro": 'Activitate Creată'
        },
        content: {
          "en": 'You have successfully created the activity ',
          "ro": 'Ai creat cu succes activitatea '
        }
      }
    },
    markAttendances: {
      title: {
        "en": 'Mark Attendances',
        "ro": 'Adauga Prezențe'
      },
      loading: {
        "en": 'Saving Attendances',
        "ro": 'Salvare Prezențe'
      },
      step: [
        {
          title: {
            "en": 'Select course & activity',
            "ro": 'Selectează cursul și activitatea'
          },
          loading: {
            "en": 'Getting courses & activities',
            "ro": 'Încărcare cursuri și activități'
          }
        },{
          title: {
            "en": 'Mark attendances',
            "ro": 'Marcare prezențe'
          },
          loading: {
            "en": 'Getting students',
            "ro": 'Încărcare studenți'
          }
        }
      ],
      attended: {
        "en": 'Check',
        "ro": 'Prezent'
      },
      notificationSuccess: {
        title: {
          "en": 'Attendances Marked',
          "ro": 'Prezențe adăugate'
        },
        content: {
          "en": 'You have successfully added attendances to ',
          "ro": 'Ai adaugat cu succes prezențe la '
        }
      }
    },
    addGrades: {
      title: {
        "en": 'Assign Grades',
        "ro": 'Adaugă Note'
      },
      loading: {
        "en": 'Saving Grades',
        "ro": 'Salvare Note'
      },
      step: [
        {
          title: {
            "en": 'Select course & activity',
            "ro": 'Selectează cursul și activitatea'
          },
          loading: {
            "en": 'Getting courses & activities',
            "ro": 'Încărcare cursuri și activități'
          }
        },{
          title: {
            "en": 'Assign grades',
            "ro": 'Adaugă note'
          },
          loading: {
            "en": 'Getting students',
            "ro": 'Încărcare studenți'
          }
        }
      ],
      marked: {
        "en": 'Grade',
        "ro": 'Notă'
      },
      notificationSuccess: {
        title: {
          "en": 'Grades Assigned',
          "ro": 'Note adăugate'
        },
        content: {
          "en": 'You have successfully added grades to ',
          "ro": 'Ai adaugat cu succes note la '
        }
      }
    },
    addCourseStudents: {
      title: {
        "en": 'Add students to course',
        "ro": 'Adaugă studenți la un curs'
      },
      loading: {
        "en": 'Adding students to course',
        "ro": 'Adăugare studenți la curs'
      },
      step: [
        {
          title: {
            "en": 'Select course',
            "ro": 'Selectează cursul'
          },
          loading: {
            "en": 'Getting courses',
            "ro": 'Încărcare cursuri'
          }
        },{
          title: {
            "en": 'Add students',
            "ro": 'Adaugă studenți'
          },
          loading: {
            "en": 'Getting students',
            "ro": 'Încărcare studenți'
          }
        }
      ],
      add: {
        "en": 'Add',
        "ro": 'Adaugă'
      },
      notificationSuccess: {
        title: {
          "en": 'Students Added',
          "ro": 'Studenți Adăugați'
        },
        content: {
          "en": 'You have successfully added students to ',
          "ro": 'Ai adaugat cu succes studenți la '
        }
      }
    },
    addUser: {
      title: {
        "en": 'Add User',
        "ro": 'Adaugă utilizator'
      },
      loading: {
        "en": 'Loading Form',
        "ro": 'Încărcare Formular'
      },
      finalLoading: {
        "en": 'Creating user',
        "ro": 'Creare utilizator'
      },
      step: [
        {
          title: {
            "en": 'Select type & enter name',
            "ro": 'Selectează tipul și completează numele'
          },
          loading: {
            "en": 'Getting details',
            "ro": 'Încărcare detalii'
          }
        },{
          title: {
            "en": 'Add email and password',
            "ro": 'Adaugă email-ul si parola'
          },
          loading: {
            "en": 'Getting students',
            "ro": 'Încărcare studenți'
          }
        }
      ],
      notificationSuccess: {
        title: {
          "en": 'User Added',
          "ro": 'Utilizator Adăugat'
        },
        content: {
          "en": 'You have successfully added the user ',
          "ro": 'Ai adaugat cu succes utilizatorul '
        }
      },
      notificationError: {
        title: {
          "en": 'User Already Exists',
          "ro": 'Utilizator Existent'
        },
        content: {
          "en": 'The user added exists already: ',
          "ro": 'Utilizatorul adăugat exista deja: '
        }
      }
    },
    placeholders: {
      selectCourse: {
        "en": 'Select course',
        "ro": 'Selectează curs'
      },
      selectActivity: {
        "en": 'Select activity',
        "ro": 'Selectează activitatea'
      },
      selectType: {
        "en": 'Select type',
        "ro": 'Selectează tip'
      },
      selectUserType: {
        "en": 'Select user type',
        "ro": 'Selecteaza tipul utilizatorului'
      },
      enterNameOfActivity: {
        "en": 'Enter name of activity (e.g Laborator 2)',
        "ro": 'Completează numele activității (ex. Laborator 2)'
      },
      enterDateOfActivity: {
        "en": 'Enter date of activity (current date by default)',
        "ro": 'Completează data activității (data curentă implicit)'
      },
      enterEmail: {
        "en": 'Enter email',
        "ro": 'Introdu adresa de email',
      },
      enterPassword: {
        "en": 'Enter password',
        "ro": 'Introdu parola'
      }
    }
  },

  errors: {
    courseRequired: {
      "en": 'Course required to continue',
      "ro": 'Curs necesar pentru a continua'
    },
    activityRequired: {
      "en": 'Activity required to continue',
      "ro": 'Activitate necesară pentru a continua'
    },
    typeRequired: {
      "en": 'Type required to continue',
      "ro": 'Tip necesar pentru a continua'
    },
    emailRequired: {
      "en": 'Email required to continue',
      "ro": 'Email necesar pentru a continua'
    },
    passwordRequired: {
      "en": 'Password required to continue',
      "ro": 'Parola necesară pentru a continua'
    },
    confirmPasswordRequired: {
      "en": 'Password repeat required to continue',
      "ro": 'Repetarea parolei e necesară pentru a continua'
    },
    passwordNoMatch: {
      "en": 'Passwords don\'t match',
      "ro": 'Parolele nu se potrivesc'
    },
    nameRequired: {
      "en": 'Name required to continue',
      "ro": 'Nume necesar pentru a continua'
    },
    firstNameRequired: {
      "en": 'First name required to continue',
      "ro": 'Prenume necesar pentru a continua'
    },
    lastNameRequired: {
      "en": 'Last name required to continue',
      "ro": 'Nume necesar pentru a continua'
    },
    dateRequired: {
      "en": 'Date required to continue',
      "ro": 'Dată necesară pentru a continua'
    },
    noResults: {
      "en": 'No results have been found',
      "ro": 'Niciun rezultat nu a fost găsit'
    },
    studentAtLeastRequired: {
      "en": 'Select at least 1 student to add attendance for!',
      "ro": 'Selectează cel puțin un student caruia sa-i salvezi prezența!'
    },
    studentAtLeastRequiredGrade: {
      "en": 'Select at least 1 student to add grade for!',
      "ro": 'Selectează cel puțin un student caruia sa-i adaugi nota!'
    },
    studentAtLeastRequiredCourse: {
      "en": 'Select at least 1 student to add course for!',
      "ro": 'Selectează cel puțin un student pe care sa-l adaugi la curs!'
    }
  },

  pages: {
    activities: {
      title: {
        "en": 'Activities',
        "ro": 'Activități'
      }
    },
    login: {
      loading: {
        "en": 'Authenticating',
        "ro": 'Autentificare'
      },
      button: {
        "en": 'Login',
        "ro": 'Autentifică'
      },
      description: {
        "en": 'Project developed for the Computer Science Faculty, Iași',
        "ro": 'Proiect realizat pentru Facultatea de Informatică, Iași'
      },
      notificationError: {
        title: {
          "en": 'Server connection failed',
          "ro": 'Conexiunea la server a eșuat'
        },
        content: {
          "en": 'We couldn\'t connect to the server. Try again later.',
          "ro": 'Nu ne-am putut conecta la server. Încercați mai târziu.'
        }
      }
    },
    dashboard: {
      uploadFile: {
        "en": 'Upload File',
        "ro": 'Încarcă Fișier'
      },
      myGrades: {
        "en": 'My Grades',
        "ro": 'Note'
      },
      myAttendances: {
        "en": 'My Attendances',
        "ro": 'Prezențe'
      },
      addActivity: {
        "en": 'Add Activity',
        "ro": 'Adaugă Activitate'
      },
      addAttendances: {
        "en": 'Add Attendances',
        "ro": 'Adaugă Prezențe'
      },
      addGrades: {
        "en": 'Add Grades',
        "ro": 'Adaugă Note'
      },
      latestActivities: {
        "en": 'Latest Activities',
        "ro": 'Ultimele Activități'
      },
      latestFiles: {
        "en": 'Latest Files',
        "ro": 'Ultimele Fișiere'
      },
      courses: {
        "en": 'Courses',
        "ro": 'Cursuri'
      }
    },
    settings: {
      title: {
        "en": 'Settings',
        "ro": 'Setări'
      },
      languageLabel: {
        "en": 'Language',
        "ro": 'Limbă'
      },
      table: {
        detailsRowsTitle: {
          "en": 'User Details',
          "ro": 'Detalii despre utilizator'
        },
        detailsRows: {
          firstName: {
            "en": 'First Name',
            "ro": 'Prenume'
          },
          lastName: {
            "en": 'Last Name',
            "ro": 'Nume'
          },
          type: {
            "en": 'Type',
            "ro": 'Tip'
          },
          email: {
            "en": 'Email',
            "ro": 'Email'
          }
        },
        settingRows: {
          support: {
            "en": "Support",
            "ro": 'Asistenta'
          },
          changePassword: {
            "en": "Change Password",
            "ro": "Schimbă parola"
          }
        }
      },
      buttons: {
        changeDetails: {
          "en": 'Change Details',
          "ro": 'Modifică'
        }
      },
      errors: {
        unavailable: {
          "en": 'unavailable',
          "ro": 'indisponibil'
        }
      }
    }
  }
})

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
