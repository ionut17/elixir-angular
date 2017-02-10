app.constant("config", {
    apiEndpoint: "http://localhost:8080/api/",
    icons: "material", //'material' or 'awesome'

    preloader: {
      artificialTime: 2500
    },

    notifications: {
      autoDismissTime: 10000,
    },

    authorizedRoles: {
      activities: {
        list: ['*'],
        sublist: ['ADMIN', 'LECTURER'],
        view: ['*']
      },
      courses: {
        list: ['*'],
        view: ['ADMIN', 'LECTURER']
      },
      dashboard: ['*'],
      groups: {
        list: ['*'],
        view: ['ADMIN', 'LECTURER']
      },
      settings: ['*'],
      users: {
        list: ['ADMIN'],
        view: ['*']
      }
    }

})
