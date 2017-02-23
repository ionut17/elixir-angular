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
