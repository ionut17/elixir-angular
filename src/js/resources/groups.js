app.factory("Groups", ["config", "$resource", function(config, $resource) {
    return $resource(config.apiEndpoint + "groups", {}, {
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
            url: config.apiEndpoint + "groups/:id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        }
    });
}]);
