app.factory("Users", ["config", "$resource", function(config, $resource) {
    return $resource(config.apiEndpoint + "users", {}, {
        getAll: {
            method: "GET",
            isArray: true,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                Authorization: function() {
                    return "Bearer ";
                }
            }
        }
    });
}]);
