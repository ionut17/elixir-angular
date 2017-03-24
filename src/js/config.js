app.constant("config", {
    development: true,
    apiEndpoint: "http://localhost:8080/api/",
    // apiEndpoint: "http://elixir.ionutrobert.com:8080/elixir-api/api/",
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
        sublist: ['*'],
        view: ['*'],
        create: ['ADMIN', 'LECTURER']
      },
      files: {
        create: ['STUDENT']
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
