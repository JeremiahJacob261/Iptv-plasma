'use strict';
(function(){
 if (!document.querySelector('script[src="/navigation-ad.js"]')) {
  const navigationAd = document.createElement('script');
  navigationAd.src = '/navigation-ad.js';
  navigationAd.defer = true;
  document.head.append(navigationAd);
 }
 function brandPlayer(video){
  if(video.closest('[data-plasma-player]'))return;
  let frame=video.parentElement;
  if(!frame.classList.contains('x-media-frame')){frame=document.createElement('div');video.before(frame);frame.append(video);}
  frame.classList.add('plasma-video-frame');frame.dataset.plasmaPlayer='';
  if(video.id==='iptv-video'){
   const blockedPlay=document.createElement('button');
   blockedPlay.type='button';blockedPlay.className='plasma-blocked-play';blockedPlay.setAttribute('aria-label','Play channel');
   blockedPlay.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
   blockedPlay.onclick=()=>{video.dataset.blocked='false';video.dataset.loading='true';video.play().catch(()=>{video.dataset.loading='false';video.dataset.blocked='true';});};
   frame.append(blockedPlay);
   video.addEventListener('waiting',()=>{if(!video.paused)video.dataset.loading='true';});
   video.addEventListener('playing',()=>{video.dataset.loading='false';video.dataset.blocked='false';});
   video.addEventListener('pause',()=>{if(video.readyState >= 2)video.dataset.loading='false';});
   video.addEventListener('error',()=>{video.dataset.loading='false';});
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
   full.onclick=async()=>{
    try{
     if(document.fullscreenElement){await document.exitFullscreen();return;}
     if(frame.requestFullscreen)await frame.requestFullscreen();
     else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();
     else document.querySelector('#stream-status').textContent='Full screen is unavailable in this browser.';
    }catch{document.querySelector('#stream-status').textContent='Full screen was blocked by the browser.';}
   };
   frame.append(bar);video.controls=false;
  }
  const mark=document.createElement('span');mark.className='plasma-watermark';mark.setAttribute('aria-hidden','true');
  const image=document.createElement('img');image.src='/assets/plasmax-mark.svg';image.alt='';mark.append(image);frame.append(mark);
 }
 function scan(node){if(node.nodeType!==1)return;if(node.matches('video'))brandPlayer(node);node.querySelectorAll('video').forEach(brandPlayer);}
 scan(document.body);
 new MutationObserver(records=>{for(const r of records)for(const node of r.addedNodes)scan(node);}).observe(document.body,{childList:true,subtree:true});
 // The homepage header is the shared public navigation, including exchange routes.
 function mountPublicNavigation(){
  if(/^\/admin(?:\/|$)/.test(location.pathname)||document.querySelector('#plasmax-admin'))return;
  if(document.getElementById('plasma-public-header'))return;
  const legacy=document.querySelector('header#_header-2-15');
  const exchangeHost=document.querySelector('#plasmax-exchange-page, #plasmax-exchange-status, #plasmax-exchange-legal');
  if(!legacy&&!exchangeHost)return;
  const header=document.createElement('header');
  header.id='plasma-public-header';
  header.className='plasma-public-header';
  const links=[['Exchange','/exchange/'],['Home','/'],['Countries','/countries/'],['Categories','/categories/'],['Languages','/languages/']];
  const social=[['X','https://x.com/plasma1337x','x'],['Twitch','https://www.twitch.tv/plasma1337x','twitch']];
  const path=location.pathname.replace(/\/+$/,'')||'/';
  const onExchange=/^\/exchange(?:\/|$)/.test(path);
  const primaryHref=onExchange?'/exchange/#exchange':'/iptv-player/';
  const primaryLabel=onExchange?'Start Exchange':'Watch Now';
  const menuLinks=links.map(([label,href])=>'<li><a href="'+href+'"'+((href.replace(/\/+$/,'')||'/')===path?' aria-current="page"':'')+'>'+label+'</a></li>').join('');
  const socialLinks=social.map(([label,href,key])=>'<li><a href="'+href+'" target="_blank" rel="noopener noreferrer" data-social-icon="'+key+'" aria-label="PlasmaX on '+label+'" title="'+label+'"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'+(key==='x'?'<path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l7.3-8.5L1.8 2h6.5l4.5 6.8L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z"/>':'<path d="M4.3 0 0 4.3v15.4h5.1V24l4.3-4.3h3.4L20.6 12V0H4.3Zm14.6 11.1-3.4 3.5H12l-3 3v-3H5.1V1.7h13.8v9.4ZM15.4 4.3h1.7v5.1h-1.7V4.3Zm-4.7 0h1.7v5.1h-1.7V4.3Z"/>')+'</svg></a></li>').join('');
  header.innerHTML='<div class="plasma-public-header-row"><a class="plasma-public-logo" href="/" aria-label="PlasmaX home"><img src="/assets/plasmax-logo.svg" alt="PlasmaX"></a><nav class="plasma-public-nav" aria-label="Main navigation"><button type="button" class="plasma-public-menu-open" aria-label="Open navigation menu" aria-expanded="false" aria-controls="plasma-public-menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M2 4h20v3H2zm0 7h20v3H2zm0 7h20v3H2z"/></svg></button><ul id="plasma-public-menu"><li class="plasma-public-menu-close-row"><button type="button" class="plasma-public-menu-close" aria-label="Close navigation menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" fill="none" stroke="currentColor" stroke-width="2.5"/></svg></button></li>'+menuLinks+socialLinks+'<li class="plasma-public-mobile-watch"><a href="'+primaryHref+'">'+primaryLabel+'</a></li></ul></nav><a class="plasma-public-watch" href="'+primaryHref+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v18l15-9z" fill="currentColor"/></svg><span>'+primaryLabel+'</span></a></div>';
  const toggle=header.querySelector('.plasma-public-menu-open');
  const close=header.querySelector('.plasma-public-menu-close');
  const menu=header.querySelector('#plasma-public-menu');
  const mobile=typeof matchMedia==='function'?matchMedia('(width < 992px)'):null;
  // A top-layer popover keeps the same full-screen homepage menu above
  // embedded exchange widgets, ads and any page-specific stacking contexts.
  const topLayer=typeof menu.showPopover==='function';
  let previousOverflow=null;
  function setOpen(open,restore=false){
   if(open&&mobile&&!mobile.matches)return;
   if(open){
    if(previousOverflow===null)previousOverflow=document.documentElement.style.overflow;
    document.documentElement.style.overflow='hidden';
    menu.classList.add('is-open');
    if(topLayer){
     menu.setAttribute('popover','manual');
     try{menu.showPopover();}catch{menu.removeAttribute('popover');}
    }
    toggle.setAttribute('aria-expanded','true');
    close.focus();
   }else{
    if(topLayer&&menu.hasAttribute('popover')){
     try{menu.hidePopover();}catch{}
     menu.removeAttribute('popover');
    }
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded','false');
    if(previousOverflow!==null){document.documentElement.style.overflow=previousOverflow;previousOverflow=null;}
    if(restore)toggle.focus();
   }
  }
  toggle.addEventListener('click',()=>setOpen(true));
  close.addEventListener('click',()=>setOpen(false,true));
  menu.addEventListener('click',event=>{if(event.target.closest('a'))setOpen(false);});
  header.addEventListener('keydown',event=>{
   if(!menu.classList.contains('is-open'))return;
   if(event.key==='Escape'){event.preventDefault();setOpen(false,true);}
   if(event.key==='Tab'){
    const items=[...menu.querySelectorAll('button,a[href]')];
    if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1).focus();}
    else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0].focus();}
   }
  });
  if(mobile){
   const reset=event=>{if(!event.matches)setOpen(false);};
   if(mobile.addEventListener)mobile.addEventListener('change',reset);
   else if(mobile.addListener)mobile.addListener(reset);
  }
  if(legacy)legacy.replaceWith(header);
  else exchangeHost.before(header);
 }
 mountPublicNavigation();
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
  document.querySelectorAll('.oxy-site-navigation > ul').forEach(list=>{
   if(list.querySelector('[data-plasmax-metals-link]'))return;
   const item=document.createElement('li');item.className='menu-item';item.dataset.plasmaxMetalsLink='';
   const link=document.createElement('a');link.href='/precious-metals/';link.textContent='Precious Metals';
   const exchangeItem=list.querySelector('[data-plasmax-exchange-link]');if(exchangeItem){link.className=exchangeItem.querySelector('a')?.className||'';exchangeItem.after(item);}else list.insertBefore(item,list.firstChild);
   item.append(link);
  });
  document.querySelectorAll('nav a, [role="navigation"] a, .menu-item a').forEach(a=>{
   const href=a.getAttribute('href') || '';
   if(['/blog/','/guest-posts/','/contact-us/','/newsletter/'].includes(href) || (href==='/iptv-player/' && /^iptv players?$/i.test(a.textContent.trim()))) { const item=a.closest('li'); if(item) item.remove(); else a.remove(); return; }
   const social = ['/x/','/x-feed/','https://twitter.com/plasma1337x','https://x.com/plasma1337x'].includes(href)?'x':(['/twitch/','/twitch-feed/','https://www.twitch.tv/plasma1337x'].includes(href)?'twitch':null);
   if(social && !a.dataset.socialIcon){a.dataset.socialIcon=social;a.href=social==='x'?'https://x.com/plasma1337x':'https://www.twitch.tv/plasma1337x';a.setAttribute('aria-label',social==='x'?'PlasmaX on X':'PlasmaX on Twitch');a.title=a.getAttribute('aria-label');a.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'+(social==='x'?'<path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l7.3-8.5L1.8 2h6.5l4.5 6.8L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z"/>':'<path d="M4.3 0 0 4.3v15.4h5.1V24l4.3-4.3h3.4L20.6 12V0H4.3Zm14.6 11.1-3.4 3.5H12l-3 3v-3H5.1V1.7h13.8v9.4ZM15.4 4.3h1.7v5.1h-1.7V4.3Zm-4.7 0h1.7v5.1h-1.7V4.3Z"/>')+'</svg>';}
  });
  document.querySelectorAll('.oxy-site-navigation > ul').forEach(list=>{
   const items=['x','twitch'].map(name=>list.querySelector(`li:has(> a[data-social-icon="${name}"])`)).filter(Boolean);
   const tail=items.at(-1);if(!tail)return;
   if(tail.nextElementSibling){for(const item of items)list.appendChild(item);}
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
  const section=document.createElement('section');section.id='plasmax-exchange-sections';section.setAttribute('aria-label','PlasmaX Exchange');(document.querySelector('.playlist-setup') || player).after(section);
  const load=()=>{const script=document.createElement('script');script.src='/exchange-sections.js';script.defer=true;document.body.append(script);};
  if(location.hash&&['#exchange'].includes(location.hash))load();
  else if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){io.disconnect();load();}},{rootMargin:'500px'});io.observe(section);}else load();
 }
 mountExchangeSections();new MutationObserver(mountExchangeSections).observe(document.body,{childList:true,subtree:true});
})();
