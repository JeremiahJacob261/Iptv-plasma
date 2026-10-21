import {Readable} from 'node:stream';
import {publicURL,PublicError,openUpstream,readLimited} from './upstream.mjs';
const error=(message,status=422,code='twitch_media_unavailable')=>new PublicError(message,status,code);
const str=(x,max=4000)=>typeof x==='string'?x.slice(0,max):'';
export function parseTwitchURL(value){
 if(typeof value==='string'&&/^[a-zA-Z0-9_]{1,25}$/.test(value))value='https://www.twitch.tv/'+value;
 const u=publicURL(value);if(u.protocol!=='https:'||u.port||!['twitch.tv','www.twitch.tv','m.twitch.tv'].includes(u.hostname))throw error('Use a public Twitch channel or video link.',400);
 const p=u.pathname.split('/').filter(Boolean);
 if(p.length===2&&p[0]==='videos'&&/^\d{1,24}$/.test(p[1]))return {type:'video',id:p[1],url:'https://www.twitch.tv/videos/'+p[1]};
 if(p.length===1&&/^[a-zA-Z0-9_]{1,25}$/.test(p[0])&&!['directory','settings','downloads','videos','subscriptions','search','wallet','inventory'].includes(p[0].toLowerCase()))return {type:'channel',id:p[0].toLowerCase(),url:'https://www.twitch.tv/'+p[0].toLowerCase()};
 throw error('Paste a Twitch channel or recorded-video link. Clips are not supported here.',400);
}
function image(value){try{const u=publicURL(value);return u.protocol==='https:'&&['static-cdn.jtvnw.net','static-cdn.jtvnw.net.'].includes(u.hostname)?u.href:'';}catch{return '';}}
export function twitchQuery(item){
 const owner='login displayName profileImageURL(width:70)';
 return item.type==='channel'?`{user(login:"${item.id}"){${owner} stream{title viewersCount game{name} createdAt previewImageURL(width:1280,height:720)}} streamPlaybackAccessToken(channelName:"${item.id}",params:{platform:"web",playerBackend:"mediaplayer",playerType:"site"}){value signature}}`:
 `{video(id:"${item.id}"){title createdAt previewThumbnailURL(width:1280,height:720) owner{${owner}} game{name}} videoPlaybackAccessToken(id:"${item.id}",params:{platform:"web",playerBackend:"mediaplayer",playerType:"site"}){value signature}}`;
}
export function normalizeTwitch(json,item){
 if(json.errors?.length)throw error('Twitch could not provide public playback details. Try again later.');
 const data=json.data||{},live=item.type==='channel',user=live?data.user:data.video?.owner,content=live?data.user?.stream:data.video;
 if(!user||!live&&!content)throw error('This Twitch channel or video was not found.',404);
 if(live&&!content)throw error('This Twitch channel is offline. Try again when the creator goes live.',409,'twitch_offline');
 const token=live?data.streamPlaybackAccessToken:data.videoPlaybackAccessToken;
 if(!token?.value||!token?.signature)throw error('Twitch did not allow public playback of this stream. It may require sign-in or a subscription.',403);
 const url=new URL(live?'https://usher.ttvnw.net/api/channel/hls/'+item.id+'.m3u8':'https://usher.ttvnw.net/vod/'+item.id+'.m3u8');
 url.search=new URLSearchParams({allow_source:'true',allow_audio_only:'true',platform:'web',player:'twitchweb',supported_codecs:'h264',playlist_include_framerate:'true',sig:token.signature,token:token.value}).toString();
 return {platform:'twitch',url:item.url,title:str(content.title)||'Twitch video',author:{name:str(user.displayName,120),username:str(user.login,40),avatar:image(user.profileImageURL)},createdAt:str(content.createdAt,50),state:live?'live':'replay',category:str(content.game?.name,120),...(live&&Number.isFinite(content.viewersCount)?{viewers:content.viewersCount}:{}),initialIndex:0,videos:[{poster:image(content.previewImageURL||content.previewThumbnailURL),sources:[{url:url.href,type:'hls',label:'Auto (HLS)'}]}]};
}
async function pageText(url){const {upstream}=await openUpstream(url);return (await readLimited(upstream,2*1024*1024)).toString('utf8');}
async function gql(query,clientId){
 // Anonymous public playback only. No OAuth, account cookies or integrity-token workarounds.
 const response=await fetch('https://gql.twitch.tv/gql',{method:'POST',redirect:'error',headers:{'Content-Type':'application/json','Client-ID':clientId},body:JSON.stringify({query}),signal:AbortSignal.timeout(15000)});
 if(!response.ok){await response.body?.cancel();throw error('Twitch refused this public playback request. Try again later.',response.status===429?429:502);}
 try{return JSON.parse((await readLimited(Readable.fromWeb(response.body),1024*1024)).toString('utf8'));}catch(e){if(e instanceof PublicError)throw e;throw error('Twitch returned invalid playback details.');}
}
async function checkManifest(url){
 try{const {upstream}=await openUpstream(url);const text=(await readLimited(upstream,512*1024)).toString('utf8');if(!text.startsWith('#EXTM3U'))throw error('Twitch did not return a playable stream.');return text;}
 catch(e){if(e.status===403||e.status===401)throw error('Twitch did not authorize public playback of this stream. It may require sign-in, a subscription, or an allowed region.',403,'twitch_access_denied');throw e;}
}
export async function resolveTwitch(value,{getPage=pageText,query=gql,check=checkManifest}={}){
 const item=parseTwitchURL(value),page=await getPage(item.url);
 // The public site publishes a nonsecret application identifier used for guest playback.
 const client=page.match(/clientId\s*[:=]\s*["']([a-zA-Z0-9]{20,64})["']/)?.[1];
 if(!client)throw error('Twitch’s public playback configuration changed. Please try again later.',502);
 const result=normalizeTwitch(await query(twitchQuery(item),client),item);await check(result.videos[0].sources[0].url);return result;
}
