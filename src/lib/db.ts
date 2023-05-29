import mariadb from 'mariadb'
import config from '../config.js'

const dbPool = mariadb.createPool(config.db)

async function query(sql:string) {
    let conn, rows
    conn = await dbPool.getConnection()
    rows = await conn.query(sql)
    conn.end()
    return rows
}



export default {
    query
}