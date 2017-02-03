app.factory("Activities", ["config", "$resource", function(config, $resource) {
    return $resource(config.apiEndpoint + "activities", {}, {
        getBasic: {
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        },
        getAll: {
            url: config.apiEndpoint + "activities/join",
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        }
    });
}]);
