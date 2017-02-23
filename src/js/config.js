app.constant("config", {
    apiEndpoint: "http://localhost:8080/api/",
    icons: "material", //'material' or 'awesome'

    preloader: {
      artificialTime: 500 //milliseconds
    },

    notifications: {
      showDate: false,
      autoDismissTime: 8000, //milliseconds
    },

    authorizedRoles: {
      activities: {
        list: ['*'],
        sublist: ['ADMIN', 'LECTURER'],
        view: ['*']
      },
      courses: {
        list: ['*'],
        view: ['*']
      },
      dashboard: ['*'],
      groups: {
        list: ['*'],
        view: ['ADMIN', 'LECTURER']
      },
      myAccount: ['*'],
      settings: ['*'],
      users: {
        list: ['ADMIN'],
        view: ['*']
      }
    }

})
