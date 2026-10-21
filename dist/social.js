'use strict';
(function(){
 const root=document.querySelector('.social-viewer');if(!root)return;
 if(root.dataset.platform==='x'){window.initXViewer(root);return;}
 const platform=root.dataset.platform,form=document.querySelector('#social-form'),input=document.querySelector('#social-url'),embed=document.querySelector('#social-embed'),status=document.querySelector('#social-status'),original=document.querySelector('#social-original'),clear=document.querySelector('#social-clear');
 setControlLabel(form.querySelector('button'),platform==='x'?'View':'Watch',platform==='x'?'arrow-top-right-on-square':'play');
 setControlLabel(clear,'Clear viewer','stop');
 let attempt=0,timer,resizeObserver;
 function parse(value){
  value=value.trim();if(platform==='twitch'&&/^[a-zA-Z0-9_]{1,25}$/.test(value))value='https://www.twitch.tv/'+value;
  let url;try{url=new URL(value);}catch{throw Error('Paste a complete '+(platform==='x'?'X':'Twitch')+' link.');}
  if(!/^https?:$/.test(url.protocol)||url.username||url.password||url.port)throw Error('Use a public '+(platform==='x'?'X':'Twitch')+' link.');
  const parts=url.pathname.split('/').filter(Boolean),host=url.hostname.toLowerCase();
  if(!['twitch.tv','www.twitch.tv','m.twitch.tv'].includes(host))throw Error('Use a twitch.tv channel or video link.');
  if(parts.length===2&&parts[0]==='videos'&&/^\d+$/.test(parts[1]))return {type:'video',id:parts[1],url:'https://www.twitch.tv/videos/'+parts[1]};
  if(parts.length===1&&/^[a-zA-Z0-9_]{1,25}$/.test(parts[0])&&!['directory','downloads','settings','subscriptions','wallet','inventory','search','videos'].includes(parts[0].toLowerCase()))return {type:'channel',id:parts[0].toLowerCase(),url:'https://www.twitch.tv/'+parts[0].toLowerCase()};
  throw Error('Use a Twitch channel or recorded-video link. Clips are not supported here.');
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
   }
  }catch(error){if(current===attempt){clearTimeout(timer);status.textContent=error.message;}}
 });
 const provided=new URLSearchParams(location.search).get('url');if(provided){input.value=provided;form.requestSubmit();}
})();
