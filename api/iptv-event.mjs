import {increment,dayKey} from '../lib/plasmax-metrics.mjs';
import {sameOrigin} from '../lib/plasmax-admin.mjs';
export default async function handler(req,res){res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).end();if(!sameOrigin(req))return res.status(403).end();try{const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};if(!['visit','play'].includes(body.event))return res.status(400).end();await increment(dayKey(body.event));return res.status(204).end();}catch{return res.status(503).end();}}
