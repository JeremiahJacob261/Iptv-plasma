// Fixed public profile only: no credentials, arbitrary URLs, or visitor tracking.
import snapshot from '../lib/x-feed-snapshot.mjs';
let cached;
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET'){res.statusCode=405;res.setHeader('Allow','GET');return res.end();}
 try{
  if(!cached||Date.now()-cached.at>300000){
   const response=await fetch('https://syndication.twitter.com/srv/timeline-profile/screen-name/plasma1337x',{signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw new Error('upstream');
   const html=await response.text();
   const match=html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
   const entries=JSON.parse(match?.[1]||'{}').props?.pageProps?.timeline?.entries;
   if(!Array.isArray(entries))throw new Error('missing timeline');
   const posts=entries.filter(e=>e.type==='tweet').slice(0,30).map(e=>e.content?.tweet).filter(Boolean).map(t=>({id:t.id_str,text:t.full_text||t.text,date:t.created_at,name:t.user?.name,username:t.user?.screen_name,avatar:t.user?.profile_image_url_https,photos:(t.extended_entities?.media||[]).filter(m=>m.type==='photo').map(m=>m.media_url_https),hasVideo:(t.extended_entities?.media||[]).some(m=>m.type!=='photo')}));
   if(!posts.length)throw new Error('empty timeline');
   cached={at:Date.now(),posts};
  }
  res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=3600');res.end(JSON.stringify({posts:cached.posts,updatedAt:cached.at,stale:false}));
 }catch{
  res.setHeader('Cache-Control','no-store');
  const saved=cached||snapshot;
  if(saved?.posts?.length)return res.end(JSON.stringify({posts:saved.posts,updatedAt:saved.at,stale:true}));
  res.statusCode=503;res.end(JSON.stringify({error:'X is not sharing this timeline right now. Please try again shortly.'}));
 }
}
