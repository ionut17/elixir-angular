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
        create: ['ADMIN', 'LECTURER'],
        edit: ['ADMIN', 'LECTURER'],
        delete: ['ADMIN', 'LECTURER']
      },
      attendances: {
        create: ['ADMIN', 'LECTURER']
      },
      grades: {
        create: ['ADMIN', 'LECTURER']
      },
      files: {
        create: ['STUDENT']
      },
      courses: {
        list: ['*'],
        view: ['*'],
        create: ['ADMIN'],
        addLecturer: ['ADMIN'],
        addStudents: ['ADMIN', 'LECTURER'],
        tools: ['ADMIN'],
        edit: ['ADMIN'],
        delete: ['ADMIN']
      },
      dashboard: {
        view: ['*'],
        user: ['ADMIN', 'LECTURER']
      },
      groups: {
        list: ['*'],
        view: ['ADMIN', 'LECTURER'],
        edit: ['ADMIN'],
        delete: ['ADMIN']
      },
      myAccount: ['*'],
      settings: ['*'],
      importCore: ['ADMIN'],
      import: ['LECTURER', 'ADMIN'],
      reports: ['LECTURER', 'ADMIN'],
      users: {
        list: ['ADMIN'],
        view: ['*'],
        edit: ['ADMIN'],
        delete: ['ADMIN'],
        create: ['ADMIN']
      }
    }

})
