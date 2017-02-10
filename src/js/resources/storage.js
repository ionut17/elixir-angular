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
