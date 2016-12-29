app.factory("Students", ["config", "$resource", function(config, $resource) {
    return $resource(config.apiEndpoint + "students", {}, {
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
