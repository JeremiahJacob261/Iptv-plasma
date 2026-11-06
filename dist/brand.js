'use strict';
(function(){
 function brandPlayer(video){
  if(video.closest('[data-plasma-player]'))return;
  let frame=video.parentElement;
  if(!frame.classList.contains('x-media-frame')){frame=document.createElement('div');video.before(frame);frame.append(video);}
  frame.classList.add('plasma-video-frame');frame.dataset.plasmaPlayer='';
  if(video.id==='iptv-video'){
   const bar=document.createElement('div');bar.className='plasma-controls';bar.setAttribute('role','group');bar.setAttribute('aria-label','Video controls');
   const button=(label,icon)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',label);b.title=label;b.innerHTML=icon;bar.append(b);return b;};
   const play=button('Play','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>');
   const mute=button('Mute','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zm12-1a6 6 0 010 8m2-11a10 10 0 010 14" fill="none" stroke="currentColor" stroke-width="2"/></svg>');
   const volume=document.createElement('input');volume.type='range';volume.min='0';volume.max='1';volume.step='0.05';volume.value=String(video.volume);volume.setAttribute('aria-label','Volume');bar.append(volume);
   const seek=document.createElement('input');seek.type='range';seek.min='0';seek.max='100';seek.value='0';seek.hidden=true;seek.className='plasma-seek';seek.setAttribute('aria-label','Seek');bar.append(seek);
   const status=document.createElement('span');status.className='plasma-live-indicator';status.textContent='LIVE';bar.append(status);
   const syncTime=()=>{const finite=Number.isFinite(video.duration)&&video.duration>0;seek.hidden=!finite;status.hidden=finite;if(finite)seek.value=String(video.currentTime/video.duration*100);};
   video.addEventListener('durationchange',syncTime);video.addEventListener('timeupdate',syncTime);seek.oninput=()=>{if(Number.isFinite(video.duration))video.currentTime=Number(seek.value)*video.duration/100;};
   const full=button('Full screen','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>');
   const togglePlayback=()=>{if(video.paused)video.play().catch(()=>{});else video.pause();};
   play.onclick=togglePlayback;
   const feedback=document.createElement('span');feedback.className='plasma-tap-feedback';feedback.setAttribute('aria-hidden','true');frame.append(feedback);
   let feedbackTimer;
   video.addEventListener('click',()=>{const wasPaused=video.paused;togglePlayback();feedback.innerHTML=wasPaused?'<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>':'<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zm6 0h4v14h-4z" fill="currentColor"/></svg>';feedback.classList.add('visible');clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>feedback.classList.remove('visible'),2000);});
   video.addEventListener('play',()=>{play.setAttribute('aria-label','Pause');play.title='Pause';play.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z" fill="currentColor"/></svg>';});
   video.addEventListener('pause',()=>{play.setAttribute('aria-label','Play');play.title='Play';play.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';});
   mute.onclick=()=>{video.muted=!video.muted;};volume.oninput=()=>{video.volume=Number(volume.value);video.muted=video.volume===0;};
   video.addEventListener('volumechange',()=>{mute.setAttribute('aria-label',video.muted?'Unmute':'Mute');mute.title=video.muted?'Unmute':'Mute';volume.value=String(video.muted?0:video.volume);});
   full.onclick=()=>document.querySelector('#fullscreen-playback')?.click();
   frame.append(bar);video.controls=false;
  }
  const mark=document.createElement('span');mark.className='plasma-watermark';mark.setAttribute('aria-hidden','true');
  const image=document.createElement('img');image.src='/assets/plasmax-mark.svg';image.alt='';mark.append(image);frame.append(mark);
 }
 function scan(node){if(node.nodeType!==1)return;if(node.matches('video'))brandPlayer(node);node.querySelectorAll('video').forEach(brandPlayer);}
 scan(document.body);
 new MutationObserver(records=>{for(const r of records)for(const node of r.addedNodes)scan(node);}).observe(document.body,{childList:true,subtree:true});
 const config=document.getElementById('plasma-config');if(!config)return;
 let data;try{data=JSON.parse(config.textContent);}catch{return;}
 // Keep navigation focused on the requested destinations and open social profiles directly.
 function updateNavigation(){
  document.querySelectorAll('.oxy-site-navigation > ul').forEach(list=>{
   if(list.querySelector('[data-plasmax-exchange-link]'))return;
   const item=document.createElement('li');item.className='menu-item';item.dataset.plasmaxExchangeLink='';
   const link=document.createElement('a');link.href='/exchange/';link.textContent='Exchange';
   const existing=list.querySelector('li > a');if(existing)link.className=existing.className;
   item.append(link);list.insertBefore(item,list.querySelector('template')||list.firstChild);
  });
  document.querySelectorAll('nav a, [role="navigation"] a, .menu-item a').forEach(a=>{
   const href=a.getAttribute('href') || '';
   if(['/blog/','/guest-posts/','/contact-us/','/newsletter/'].includes(href) || (href==='/iptv-player/' && /^iptv players?$/i.test(a.textContent.trim()))) { const item=a.closest('li'); if(item) item.remove(); else a.remove(); return; }
   const social = ['/x/','/x-feed/','https://twitter.com/plasma1337x','https://x.com/plasma1337x'].includes(href)?'x':(['/twitch/','/twitch-feed/','https://www.twitch.tv/plasma1337x'].includes(href)?'twitch':null);
   if(social && !a.dataset.socialIcon){a.dataset.socialIcon=social;a.href=social==='x'?'https://x.com/plasma1337x':'https://www.twitch.tv/plasma1337x';a.setAttribute('aria-label',social==='x'?'PlasmaX on X':'PlasmaX on Twitch');a.title=a.getAttribute('aria-label');a.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'+(social==='x'?'<path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l7.3-8.5L1.8 2h6.5l4.5 6.8L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z"/>':'<path d="M4.3 0 0 4.3v15.4h5.1V24l4.3-4.3h3.4L20.6 12V0H4.3Zm14.6 11.1-3.4 3.5H12l-3 3v-3H5.1V1.7h13.8v9.4ZM15.4 4.3h1.7v5.1h-1.7V4.3Zm-4.7 0h1.7v5.1h-1.7V4.3Z"/>')+'</svg>';}

  });
 }
 updateNavigation();
 new MutationObserver(updateNavigation).observe(document.body,{childList:true,subtree:true});
 // Count aggregate player visits and playback starts without changing the player.
 if(document.querySelector('#m3u-form')){const tracker=document.createElement('script');tracker.src='/iptv-analytics.js';tracker.defer=true;document.body.append(tracker);}
 // Mount the original exchange sections below the existing IPTV player.
 function mountExchangeSections(){
  if(document.getElementById('plasmax-exchange-sections'))return;
  const player=document.querySelector('#watch-player');if(!player)return;
  const section=document.createElement('section');section.id='plasmax-exchange-sections';section.setAttribute('aria-label','PlasmaX Exchange');player.after(section);
  const load=()=>{const script=document.createElement('script');script.src='/exchange-sections.js';script.defer=true;document.body.append(script);};
  if(location.hash&&['#exchange'].includes(location.hash))load();
  else if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){io.disconnect();load();}},{rootMargin:'500px'});io.observe(section);}else load();
 }
 mountExchangeSections();new MutationObserver(mountExchangeSections).observe(document.body,{childList:true,subtree:true});
 const ads=data.advertising;
 if(ads?.enabled&&ads.provider==='hilltop'&&!document.querySelector('script[src="/hilltop.js"]')){
  const script=document.createElement('script');script.src='/hilltop.js';script.async=true;document.head.append(script);
 }
 // Other advertising providers remain disabled until their scripts can be isolated.
})();
