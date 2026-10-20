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
   if(parts.length===3&&/^[a-zA-Z0-9_]{1,15}$/.test(parts[0])&&parts[1]==='status'&&/^\d+$/.test(parts[2])||parts.length===3&&parts[0]==='i'&&parts[1]==='web'&&/^\d+$/.test(parts[2]))return {type:'post',id:parts[2],url:'https://x.com/i/web/status/'+parts[2]};
   if(parts.length===1&&/^[a-zA-Z0-9_]{1,15}$/.test(parts[0])&&!['home','explore','search','settings','notifications','messages','i','intent'].includes(parts[0].toLowerCase()))return {type:'profile',id:parts[0],url:'https://x.com/'+parts[0]};
   throw Error('Use a public post link or an X profile link.');
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
  reset();const current=attempt;const slot=document.createElement('div');embed.append(slot);original.href=item.url;original.hidden=false;clear.hidden=false;status.textContent='Loading '+(platform==='x'?'X content':'Twitch player')+'…';
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
    const result=await Promise.race([item.type==='post'?api.createTweet(item.id,slot,{dnt:true,align:'center'}):api.createTimeline({sourceType:'profile',screenName:item.id},slot,{height:600,dnt:true}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('X has not returned this content. Try again or open the original link.')),20000);})]);
    if(current!==attempt)return;clearTimeout(timer);
    status.textContent=result?'X content loaded.':'X could not display this content. It may be unavailable or require sign-in. Try another public post or open the original link.';
   }
  }catch(error){if(current===attempt){clearTimeout(timer);status.textContent=error.message;}}
 });
 const provided=new URLSearchParams(location.search).get('url');if(provided){input.value=provided;form.requestSubmit();}
})();
