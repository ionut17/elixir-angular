app.factory("Lecturers", ["config", "$resource", function(config, $resource) {
    return $resource(config.apiEndpoint + "lecturers", {}, {
        getAll: {
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        },
        getById: {
            url: config.apiEndpoint + "lecturers/:id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        },
        add: {
            url: config.apiEndpoint + "lecturers",
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        }
    });
}]);
