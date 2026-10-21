import {openUpstream,readLimited,publicURL,PublicError} from './upstream.mjs';
const fail=(message,status=422,code='x_media_unavailable')=>new PublicError(message,status,code);
const text=(value,max=4000)=>typeof value==='string'?value.slice(0,max):'';
export function parseXURL(value){
 const url=publicURL(value);if(url.protocol!=='https:'||url.port||!['x.com','www.x.com','twitter.com','www.twitter.com','mobile.twitter.com'].includes(url.hostname))throw fail('Use a public x.com or twitter.com video link.',400);
 const p=url.pathname.split('/').filter(Boolean);
 if(p.length===3&&p[0]==='i'&&p[1]==='broadcasts'&&/^[a-zA-Z0-9]{6,64}$/.test(p[2]))return {type:'broadcast',id:p[2],url:'https://x.com/i/broadcasts/'+p[2]};
 const canonical=p.length===4&&p[0]==='i'&&p[1]==='web'&&p[2]==='status'&&/^\d+$/.test(p[3]);
 const post=(p.length===3||p.length===5&&p[3]==='video'&&/^\d+$/.test(p[4]))&&/^[a-zA-Z0-9_]{1,15}$/.test(p[0])&&p[1]==='status'&&/^\d+$/.test(p[2]);
 if(canonical||post){const id=canonical?p[3]:p[2];return {type:'post',id,index:p.length===5?Math.max(0,Number(p[4])-1):0,url:'https://x.com/i/web/status/'+id};}
 if(p[0]==='i'&&p[1]==='spaces')throw fail('X Spaces are audio rooms. Paste a video post or live broadcast link instead.',400);
 throw fail('Paste a specific X video post or live broadcast link. Profile pages do not identify a video.',400);
}
export function mediaURL(value,image=false){
 try{const u=publicURL(value);if(u.protocol!=='https:'||u.port)return '';const h=u.hostname;
 if(!((image&&h==='pbs.twimg.com')||h==='video.twimg.com'||h.endsWith('.video.pscp.tv')||h.endsWith('.video.twitter.com')))return '';
 if(/geoblocked/i.test(u.pathname))return '';return u.href;}catch{return '';}
}
function author(user={}){return {name:text(user.name,120),username:text(user.screenName||user.screen_name,40),avatar:mediaURL(user.profileImageUrl||user.profile_image_url_https,true)};}
export function broadcastInitial(html,id){
 // Read JSON data from React's public streamed payload. Never execute provider scripts.
 let flight='';for(const m of html.matchAll(/self\.__next_f\.push\((\[[\s\S]*?\])\)<\/script>/g)){try{const row=JSON.parse(m[1]);if(typeof row[1]==='string')flight+=row[1];}catch{}}
 for(const line of flight.split('\n')){const colon=line.indexOf(':');if(colon<0)continue;let tree;try{tree=JSON.parse(line.slice(colon+1));}catch{continue;}
 const visit=value=>{if(!value||typeof value!=='object')return null;if(value.broadcastId===id&&value.initial)return value.initial;for(const child of Object.values(value)){const found=visit(child);if(found)return found;}return null;};const found=visit(tree);if(found)return found;}
 throw fail('X did not expose public playback data for this broadcast. It may require sign-in or be unavailable.');
}
export function normalizeBroadcast(initial,item){
 if(!initial?.ok){const kind=text(initial?.kind);throw fail(kind==='not-found'?'This X broadcast was not found or is no longer public.':'X did not make this broadcast available for public playback.',kind==='not-found'?404:422);}
 const b=initial.broadcast||{},url=mediaURL(initial.videoUrl),state=text(b.state).toLowerCase();
 if(!url)throw fail(state==='notstarted'?'This X broadcast has not started yet. Try again when it goes live.':'X did not expose a playable stream for this broadcast.');
 return {url:item.url,title:text(b.title)||'X broadcast',author:author(b.owner),createdAt:Number.isFinite(b.startTime)?new Date(b.startTime).toISOString():'',state:state==='running'||state==='live'?'live':state==='ended'?'replay':'video',initialIndex:0,videos:[{poster:mediaURL(b.imageUrl,true),sources:[{url,type:'hls',label:'Auto (HLS)'}]}]};
}
export function normalizePost(post,item){
 if(!post?.id_str)throw fail('This X post is unavailable or requires sign-in.',404);
 const videos=(Array.isArray(post.mediaDetails)?post.mediaDetails:[]).filter(m=>['video','animated_gif'].includes(m.type)).map(m=>{
  const sources=(m.video_info?.variants||[]).map(v=>({url:mediaURL(v.url),type:/mpegurl/i.test(v.content_type)?'hls':v.content_type==='video/mp4'?'mp4':'',bitrate:Number(v.bitrate)||0})).filter(v=>v.url&&v.type).sort((a,b)=>(a.type==='mp4'?1:0)-(b.type==='mp4'?1:0)||a.bitrate-b.bitrate).reverse().map(v=>{const size=v.url.match(/\/(\d+x\d+)\//);return {...v,label:v.type==='hls'?'Auto (HLS)':size?size[1].replace('x',' × '):'MP4'};});
  return {poster:mediaURL(m.media_url_https,true),sources};
 }).filter(m=>m.sources.length);
 return {url:item.url,title:text(post.text)||'X video',author:author(post.user),createdAt:text(post.created_at,50),state:'video',initialIndex:Math.min(item.index||0,Math.max(0,videos.length-1)),videos};
}
async function getPublicText(url){const {upstream}=await openUpstream(url);return (await readLimited(upstream,2*1024*1024)).toString('utf8');}
export async function resolveX(value,getText=getPublicText){
 const item=parseXURL(value);
 if(item.type==='broadcast')return normalizeBroadcast(broadcastInitial(await getText('https://studio.x.com/embed/broadcast/'+item.id),item.id),item);
 const token=((Number(item.id)/1e15)*Math.PI).toString(36).replace(/0|\./g,'');
 let post;try{post=JSON.parse(await getText('https://cdn.syndication.twimg.com/tweet-result?id='+item.id+'&lang=en&token='+token));}catch(error){if(error instanceof PublicError)throw error;throw fail('X did not return public post data. Try again later.');}
 const result=normalizePost(post,item);if(result.videos.length)return result;
 const links=post.entities?.urls||[];for(const link of links){let broadcast;try{broadcast=parseXURL(link.expanded_url);}catch{continue;}if(broadcast.type==='broadcast')return resolveX(broadcast.url,getText);}
 return result;
}
