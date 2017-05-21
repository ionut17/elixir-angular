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
        },
        delete: {
          url: config.apiEndpoint + "students/:student_id",
          method: "DELETE",
          params: {student_id: '@student_id'},
          headers: {
              Authorization: function() {
                  return "Bearer "+AuthService.getToken();
              }
          }
        }
    });
}]);
