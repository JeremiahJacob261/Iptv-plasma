'use strict';
(function(){
 function brandPlayer(video){
  if(video.closest('[data-plasma-player]'))return;
  let frame=video.parentElement;
  if(!frame.classList.contains('x-media-frame')){frame=document.createElement('div');video.before(frame);frame.append(video);}
  frame.classList.add('plasma-video-frame');frame.dataset.plasmaPlayer='';
  const mark=document.createElement('span');mark.className='plasma-watermark';mark.setAttribute('aria-hidden','true');
  const image=document.createElement('img');image.src='/assets/plasmax-mark.svg';image.alt='';mark.append(image);frame.append(mark);
 }
 function scan(node){if(node.nodeType!==1)return;if(node.matches('video'))brandPlayer(node);node.querySelectorAll('video').forEach(brandPlayer);}
 scan(document.body);
 new MutationObserver(records=>{for(const r of records)for(const node of r.addedNodes)scan(node);}).observe(document.body,{childList:true,subtree:true});
 const config=document.getElementById('plasma-config');if(!config)return;
 let data;try{data=JSON.parse(config.textContent);}catch{return;}
 for(const [key,label,base] of [['xProfile','Follow on X','x.com'],['twitchURL','Watch on Twitch','twitch.tv']]){
  if(!data[key])continue;try{const url=new URL(data[key]);if(url.protocol!=='https:'||!(url.hostname===base||url.hostname==='www.'+base||(key==='xProfile'&&['twitter.com','www.twitter.com'].includes(url.hostname))))continue;
   const nav=document.querySelector('.plasma-platforms');if(!nav)continue;const a=document.createElement('a');a.href=url.href;a.textContent=label;a.target='_blank';a.rel='noopener noreferrer';a.className='plasma-profile-link';nav.append(a);
  }catch{/* Missing/invalid configured account links stay absent. */}
 }
 const ads=data.advertising;
 if(ads?.enabled&&ads.provider==='hilltop'&&!document.querySelector('script[src="/hilltop.js"]')){
  const script=document.createElement('script');script.src='/hilltop.js';script.async=true;document.head.append(script);
 }
 if(!ads?.enabled||ads.provider!=='adsense'||!/^ca-pub-\d{16}$/.test(ads.publisherId)||!/^\d{5,20}$/.test(ads.slotId))return;
 const slot=document.querySelector('.plasma-ad');if(!slot)return;
 const start=()=>{slot.hidden=false;const ins=document.createElement('ins');ins.className='adsbygoogle';ins.dataset.adClient=ads.publisherId;ins.dataset.adSlot=ads.slotId;ins.dataset.adFormat='auto';ins.dataset.fullWidthResponsive='true';slot.append(ins);
  const script=document.createElement('script');script.async=true;script.crossOrigin='anonymous';script.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+ads.publisherId;script.onerror=()=>{slot.hidden=true;};document.head.append(script);(window.adsbygoogle=window.adsbygoogle||[]).push({});};
 if(typeof IntersectionObserver==='undefined')start();else{const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){io.disconnect();start();}},{rootMargin:'200px'});io.observe(slot.parentElement);}
})();

