// Types
import { FastifyInstance } from "fastify"

// Libs
import db from '../lib/db.js'



export default async function (server:FastifyInstance):Promise<void> {

    server.get('/dbsleep', async (_req, res) => {
        await db.query(`SELECT SLEEP(5)`)
        res.send( 'done' )
    })

    server.get('/code', async (_req, res) => {
        const num = 13344
    
        const letters = ['R','T','P','A','S','B','G','F','H','B']
        const arr = Array.from( num.toString() )
        const code = arr.map(x=>letters[Number(x)]).join('')
    
        res.send(code)
    })

}