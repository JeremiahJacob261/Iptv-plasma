import {resolveTwitch} from '../lib/twitch-media.mjs';
import {sendError} from '../lib/upstream.mjs';
export default async function handler(req,res){
 if(req.method!=='GET'){res.statusCode=405;res.setHeader('Allow','GET');res.end();return;}
 try{const result=await resolveTwitch(new URL(req.url,'https://player.local').searchParams.get('url'));res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(result));}
 catch(error){console.error('twitch_media_failed',error.status||502,error.code||'source_error');sendError(res,error);}
}
