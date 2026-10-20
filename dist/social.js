'use strict';
(function(){
 const root=document.querySelector('.social-viewer');if(!root)return;
 const platform=root.dataset.platform,form=document.querySelector('#social-form'),input=document.querySelector('#social-url'),embed=document.querySelector('#social-embed'),status=document.querySelector('#social-status'),original=document.querySelector('#social-original'),clear=document.querySelector('#social-clear');
 setControlLabel(form.querySelector('button'),platform==='x'?'View':'Watch',platform==='x'?'arrow-top-right-on-square':'play');
 setControlLabel(clear,'Clear viewer','stop');
 let attempt=0,widgetsPromise,timer,resizeObserver;
 function parse(value){
  value=value.trim();if(platform==='twitch'&&/^[a-zA-Z0-9_]{1,25}$/.test(value))value='https://www.twitch.tv/'+value;
  let url;try{url=new URL(value);}catch{throw Error('Paste a complete '+(platform==='x'?'X':'Twitch')+' link.');}
  if(!/^https?:$/.test(url.protocol)||url.username||url.password||url.port)throw Error('Use a public '+(platform==='x'?'X':'Twitch')+' link.');
  const parts=url.pathname.split('/').filter(Boolean),host=url.hostname.toLowerCase();
  if(platform==='x'){
   if(!['x.com','www.x.com','twitter.com','www.twitter.com','mobile.twitter.com'].includes(host))throw Error('Use a link from x.com or twitter.com.');
   if(parts.length===3&&parts[0]==='i'&&parts[1]==='broadcasts'&&/^[a-zA-Z0-9]{6,64}$/.test(parts[2]))return {type:'broadcast',id:parts[2],url:'https://x.com/i/broadcasts/'+parts[2]};
   if(parts[0]==='i'&&parts[1]==='spaces')throw Error('X Spaces are audio rooms, not live-video broadcasts. Paste a live-video post or an x.com/i/broadcasts/ link.');
   const post=parts.length===3&&/^[a-zA-Z0-9_]{1,15}$/.test(parts[0])&&parts[1]==='status'&&/^\d+$/.test(parts[2])?parts[2]:
    parts.length===4&&parts[0]==='i'&&parts[1]==='web'&&parts[2]==='status'&&/^\d+$/.test(parts[3])?parts[3]:
    parts.length===5&&/^[a-zA-Z0-9_]{1,15}$/.test(parts[0])&&parts[1]==='status'&&/^\d+$/.test(parts[2])&&parts[3]==='video'&&/^\d+$/.test(parts[4])?parts[2]:null;
   if(post)return {type:'post',id:post,url:'https://x.com/i/web/status/'+post};
   if(parts.length===1&&/^[a-zA-Z0-9_]{1,15}$/.test(parts[0])&&!['home','explore','search','settings','notifications','messages','i','intent'].includes(parts[0].toLowerCase()))return {type:'profile',id:parts[0],url:'https://x.com/'+parts[0]};
   throw Error('Use an X live broadcast, public post, or profile link. Live broadcast links look like x.com/i/broadcasts/…');
  }
  if(!['twitch.tv','www.twitch.tv','m.twitch.tv'].includes(host))throw Error('Use a twitch.tv channel or video link.');
  if(parts.length===2&&parts[0]==='videos'&&/^\d+$/.test(parts[1]))return {type:'video',id:parts[1],url:'https://www.twitch.tv/videos/'+parts[1]};
  if(parts.length===1&&/^[a-zA-Z0-9_]{1,25}$/.test(parts[0])&&!['directory','downloads','settings','subscriptions','wallet','inventory','search','videos'].includes(parts[0].toLowerCase()))return {type:'channel',id:parts[0].toLowerCase(),url:'https://www.twitch.tv/'+parts[0].toLowerCase()};
  throw Error('Use a Twitch channel or recorded-video link. Clips are not supported here.');
 }
 function widgets(){
  if(window.twttr?.widgets)return Promise.resolve(window.twttr.widgets);
  if(!widgetsPromise)widgetsPromise=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='https://platform.twitter.com/widgets.js';script.async=true;
   const timeout=setTimeout(()=>{script.remove();widgetsPromise=null;reject(Error('X is taking too long to respond. Try again or open the original link.'));},15000);
   script.onload=()=>{clearTimeout(timeout);if(window.twttr?.widgets)resolve(window.twttr.widgets);else{widgetsPromise=null;reject(Error('X embeds could not load. Check content blockers and try again.'));}};
   script.onerror=()=>{clearTimeout(timeout);script.remove();widgetsPromise=null;reject(Error('X embeds could not load. Check your connection or content blocker.'));};document.head.append(script);
  });return widgetsPromise;
 }
 function reset(){attempt++;resizeObserver?.disconnect();resizeObserver=null;clearTimeout(timer);embed.replaceChildren();original.hidden=true;clear.hidden=true;status.textContent='Viewer cleared. Paste another link to continue.';}
 clear.addEventListener('click',reset);
 form.addEventListener('submit',async event=>{
  event.preventDefault();let item;try{item=parse(input.value);}catch(error){status.textContent=error.message;input.focus();return;}
  reset();const current=attempt;const slot=document.createElement('div');embed.append(slot);original.href=item.url;original.hidden=false;clear.hidden=false;status.textContent='Loading '+(platform==='x'?(item.type==='broadcast'?'X live broadcast':'X content'):'Twitch player')+'…';
  try{
   if(platform==='twitch'){
    const url=new URL('https://player.twitch.tv/');url.searchParams.set(item.type,item.type==='video'?'v'+item.id:item.id);url.searchParams.set('parent',location.hostname);url.searchParams.set('autoplay','false');
    const frame=document.createElement('iframe');frame.src=url.href;frame.title=item.type==='channel'?'Twitch stream: '+item.id:'Twitch video';frame.allow='autoplay; fullscreen; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
    frame.addEventListener('load',()=>{if(current===attempt){clearTimeout(timer);status.textContent='Twitch player loaded. Press Play to watch. Availability is shown inside the player.';}});
    slot.append(frame);
    // Twitch requires a 400x300 layout viewport; fit that viewport on narrow phones.
    const fit=()=>{const width=embed.clientWidth;if(!width)return;const layoutWidth=Math.max(400,width),height=Math.max(300,layoutWidth*9/16),scale=width/layoutWidth;frame.style.width=layoutWidth+'px';frame.style.height=height+'px';frame.style.transform='scale('+scale+')';frame.style.transformOrigin='top left';slot.style.height=height*scale+'px';};
    fit();if(typeof ResizeObserver==='function'){resizeObserver=new ResizeObserver(fit);resizeObserver.observe(embed);}
    timer=setTimeout(()=>{if(current===attempt)status.textContent='If the player has not appeared, check your connection or content blocker, or open the original Twitch link.';},15000);
   }else{
    const api=await widgets();if(current!==attempt)return;
    if(item.type==='broadcast'&&typeof api.createBroadcast!=='function')throw Error('X’s broadcast embed is unavailable. Try again or open the original broadcast link.');
    const request=item.type==='broadcast'?api.createBroadcast(item.id,slot,{dnt:true,width:'100%'}):item.type==='post'?api.createTweet(item.id,slot,{dnt:true,align:'center'}):api.createTimeline({sourceType:'profile',screenName:item.id},slot,{height:600,dnt:true});
    const result=await Promise.race([request,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('X has not returned this content. Try again or open the original link.')),20000);})]);
    if(current!==attempt)return;clearTimeout(timer);
    if(result&&item.type==='broadcast'){
     const frame=result.tagName==='IFRAME'?result:slot.querySelector('iframe');
     if(frame){frame.title='X live broadcast';frame.allow='autoplay; fullscreen; picture-in-picture';frame.allowFullscreen=true;}
     status.textContent='X broadcast player ready. Press Play to watch live video or an available replay. X controls whether this broadcast is available.';
    }else status.textContent=result?'X content loaded.':'X could not display this content. It may be unavailable, ended without a replay, or require sign-in. Try another public link or open the original.';
   }
  }catch(error){if(current===attempt){clearTimeout(timer);status.textContent=error.message;}}
 });
 const provided=new URLSearchParams(location.search).get('url');if(provided){input.value=provided;form.requestSubmit();}
})();
