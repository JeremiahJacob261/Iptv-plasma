import {createHmac,createHash,timingSafeEqual} from 'node:crypto';
const COOKIE='plasmax_admin';
const digest = s => createHash('sha256').update(String(s)).digest();
const equal = (a,b) => timingSafeEqual(digest(a),digest(b));
export function configured(){return (process.env.PLASMAX_ADMIN_PASSWORD||'').length>=20 && (process.env.PLASMAX_ADMIN_SESSION_SECRET||'').length>=32;}
export function credentialsMatch(username,password){return configured() && equal(username,process.env.PLASMAX_ADMIN_USERNAME||'admin') && equal(password,process.env.PLASMAX_ADMIN_PASSWORD);}
function signature(payload){return createHmac('sha256',process.env.PLASMAX_ADMIN_SESSION_SECRET).update(payload).digest('base64url');}
export function makeSession(){const payload=Buffer.from(JSON.stringify({exp:Date.now()+8*60*60*1000})).toString('base64url');return payload+'.'+signature(payload);}
export function validSession(req){if(!configured())return false;const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!token||token.length>1024)return false;const [payload,sig,extra]=token.split('.');if(!payload||!sig||extra||!equal(sig,signature(payload)))return false;try{const data=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));return Number.isFinite(data.exp)&&data.exp>Date.now()&&data.exp<=Date.now()+8*60*60*1000;}catch{return false;}}
export function sameOrigin(req){try{const origin=new URL(req.headers.origin);return origin.host===req.headers.host && (origin.protocol==='https:' || (origin.protocol==='http:' && ['localhost','127.0.0.1'].includes(origin.hostname)));}catch{return false;}}
export function setCookie(res,token,maxAge=28800){res.setHeader('Set-Cookie',`${COOKIE}=${token}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`);}
export function noStore(res){res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');}
