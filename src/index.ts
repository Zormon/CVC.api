/////////////////////////////////////////////////////////////////////////////////////////////
// ------------------------------------ IMPORTS / CONSTS --------------------------------- //
/////////////////////////////////////////////////////////////////////////////////////////////

import path from 'path'
import { fileURLToPath } from 'url'
import { fastify, FastifyInstance } from 'fastify'
import config from './config.js'

const __filename:string = fileURLToPath(import.meta.url)
const __dirname:string = path.dirname(__filename)
const server:FastifyInstance = fastify()


/////////////////////////////////////////////////////////////////////////////////////////////
// ----------------------------------------- ROUTES -------------------------------------- //
/////////////////////////////////////////////////////////////////////////////////////////////

// Services
import GuardiasSrv from './services/guardias.js'
server.register(GuardiasSrv, { prefix: '/guardias' })

import DebugSrv from './services/debug.js'
server.register(DebugSrv, { prefix: '/debug' })


/////////////////////////////////////////////////////////////////////////////////////////////
// ------------------------------------------ MAIN --------------------------------------- //
/////////////////////////////////////////////////////////////////////////////////////////////

declare const PhusionPassenger:true|undefined

if (typeof (PhusionPassenger) !== 'undefined') {
  server.listen({ path: 'passenger', host: '127.0.0.1' })
} else {
  server.listen({port: config.server.port} )
}