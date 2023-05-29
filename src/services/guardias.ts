// Types
import { FastifyInstance } from "fastify"

// Libs
import {addDays, sleep} from '../lib/functions.js'
import db from '../lib/db.js'
import config from '../config.js'



export default async function (server:FastifyInstance) {

    // Update guardias
    server.head<I_RequestGuardiasUpdate>('/update', async (req, res) => {
        let today:Date = new Date()
        let date:Date, day:number, month:number, year:number, dateString:string
        
        await db.query('DELETE FROM guardias')
        await db.query('ALTER TABLE guardias AUTO_INCREMENT=1')
        
        const daysToFetch = req.query.days?? 5
        for (let i=-1;i<daysToFetch;i++) {
            date = addDays(today,i)
            day = date.getDate()
            month = date.getMonth() + 1
            year = date.getFullYear()

            dateString = `${year}-${month}-${day}`


            const url = `https://api-vcomm-guardias.vcomm.es/v1/farmacias/guardia?limit=1000&estilo=completo&fecha=${dateString}`
            let guardias:T_Guardia[] = []
            
            await fetch(url, {
                method: 'GET', cache: 'no-cache',
                headers: {
                    Authorization: `Bearer ${config.vcomm.bearer}`,
                    'X-Organization': config.vcomm.XOrg
                }
            }).then(data => data.json()
            ).then(async data => {
                res.code(202).send()
                for (let item of data.informacion) {
                    const zonaID = await db.query(`SELECT id FROM zones WHERE name='${item.zona_guardia}'`)
                    if (zonaID.length>0) {
                        const geo = JSON.parse(item.contactos_profesionales[0].coordenadas)
                        guardias.push({
                            zone: zonaID[0].id,
                            name: item.nombre,
                            address: item.contactos_profesionales[0].direccion,
                            geo: geo,
                            phone: item.contactos_profesionales[0].telefono,
                            type: item.horarios[0].tipo == 'Guardia 24 horas'? 'normal' : 'refuerzo'
                        })
                    }
                }

                // Insert in DB
                for (let item of guardias) {
                    db.query(`INSERT INTO guardias(date,zone,name,address,geo,phone,type) VALUES(
                        '${dateString}',
                        ${item.zone},
                        '${item.name}',
                        '${item.address}',
                        POINT(${item.geo[0]},${item.geo[1]}),
                        '${item.phone}',
                        '${item.type}'
                    )`)
                }
            }).catch(err=>{ console.log('== ERROR == '+err); res.code(500).send() })

            await sleep(2000)
        }
    })

    // Get guardias
    server.get('/', async (req, res) => {
        const rows = await db.query(`SELECT * FROM guardias`)
        res.send( rows )
    })

    // Get guardias by zone
    server.get<I_RequestGuardias>('/:zone', async (req, res) => {
        const zone = req.params.zone
        const zoneName = await db.query(`SELECT name FROM zones WHERE id=${zone}`)
        if (zoneName.length ==0)                    { res.status(404).send(); return }
        if ( !/^\d+$/.test(zone) || zone.length>4 ) { res.status(400).send(); return }

        const updated = await db.query(`SELECT version FROM guardias ORDER BY version DESC LIMIT 1`)
        const rows:T_Guardia[] = await db.query(`SELECT DATE_FORMAT(date, '%Y-%m-%d') date,name,address,phone,type,ST_X(geo) geo_x,ST_Y(geo) geo_y FROM guardias WHERE zone=${zone} ORDER BY type`)
        if (rows.length ==0)        { res.status(404).send(); return }

        
        // Group by date
        let groups:any = {} //TODO: type
        
        for (let item of rows) {
            const day = item.date!
            if (groups[day] == undefined) { groups[day] = [] }
            delete item.date
            groups[day].push(item)
        }
        
        let response = {
            guardias: {
                zone: zoneName[0].name,
                lastUpdated: updated[0].version,
                days: groups
            }
        }

        res.send( response )
    })

    // Get guardias by zone and date
    server.get<I_RequestGuardias>('/:zone/:date', async (req, res) => {
        const zone = req.params.zone
        const zoneName = await db.query(`SELECT name FROM zones WHERE id=${zone}`)
        if (zoneName.length ==0)    { res.status(404).send(); return }

        const date = req.params.date!

        if (
            !/^\d+$/.test(zone)
            || zone.length>4
            || !!!Date.parse(date)
        ) { res.status(400).send(); return }

        const updated = await db.query(`SELECT version FROM guardias ORDER BY version DESC LIMIT 1`)
        const rows:T_Guardia[] = await db.query(`SELECT name,address,phone,type,ST_X(geo) geo_x,ST_Y(geo) geo_y FROM guardias WHERE zone=${zone} AND date='${date}'`)

        if (rows.length ==0)        { res.status(404).send(); return }

        let response = {
            info: {
                zone: zoneName[0].name,
                date: date,
                lastUpdated: updated[0].version
            },
            guardias: rows
        }

        res.send( response )
    })
    
    // Old API
    server.get<I_RequestGuardias>('/old/:zone/:date', async (req, res) => {
        const zone = req.params.zone
        const zoneName = await db.query(`SELECT name FROM zones WHERE id=${zone}`)
        if (zoneName.length ==0)    { res.status(404).send(); return }

        const date = req.params.date!

        if (
            !/^\d+$/.test(zone)
            || zone.length>4
            || !!!Date.parse(date)
        ) { res.status(400).send(); return }

        const guardias:T_Guardia[] = await db.query(`SELECT name titular,address direccion,phone telefono FROM guardias WHERE type='normal' AND zone=${zone} AND date='${date}'`)
        const refuerzo:T_Guardia[] = await db.query(`SELECT name titular,address direccion,phone telefono FROM guardias WHERE type='refuerzo' AND zone=${zone} AND date='${date}'`)

        if (guardias.length == 0)        { res.status(404).send(); return }

        let response = {
            date: date.split('-').reverse().join('-'),
            message:  "success",
            values: {
                guardias: guardias,
                refuerzo: refuerzo
            }
        }

        res.send( response )
    })

}