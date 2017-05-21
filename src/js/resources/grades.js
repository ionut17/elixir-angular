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
        getByCourseId: {
            url: config.apiEndpoint + "grades/course/:course_id",
            method: "GET",
            isArray: true,
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
