type T_AppConf = {
    server: {
        port: number
    },
    db: {
        host: string,
        user: string,
        password: string,
        database: string,
        connectionLimit: number
    },
    vcomm: {
        bearer: string,
        XOrg: string
    }
}

interface T_Guardia {
    date?: string,
    zone: number,
    name: string,
    address: string,
    geo: number[],
    phone: string,
    type: string
}


interface I_RequestGuardiasUpdate extends RequestGenericInterface {
    Querystring: {
      days?: number
    }
  }

interface I_RequestGuardias extends RequestGenericInterface {
    Params: {
        zone: string
        date?: string
    }
}
