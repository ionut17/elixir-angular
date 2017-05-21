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
        getByCourseId: {
            url: config.apiEndpoint + "files/course/:course_id",
            method: "GET",
            isArray: true,
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
