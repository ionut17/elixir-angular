app.factory("Groups", ["config", "$resource", "AuthService", function(config, $resource, AuthService) {
    return $resource(config.apiEndpoint + "groups", {}, {
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
            url: config.apiEndpoint + "groups/all",
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
            url: config.apiEndpoint + "groups/:id",
            method: "GET",
            headers: {
                'Accept': 'application/json',
                Authorization: function() {
                    return "Bearer "+AuthService.getToken();
                }
            }
        },
        delete: {
          url: config.apiEndpoint + "groups/:group_id",
          method: "DELETE",
          params: {student_id: '@group_id'},
          headers: {
              Authorization: function() {
                  return "Bearer "+AuthService.getToken();
              }
          }
        }
    });
}]);
