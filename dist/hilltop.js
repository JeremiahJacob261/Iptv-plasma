'use strict';
(function(){
 const tag=document.getElementById('plasma-config');let ads;try{ads=JSON.parse(tag.textContent).advertising;}catch{return;}
 if(!ads?.enabled||ads.provider!=='hilltop')return;
 function valid(value){try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='admired-raise.com'?u.href:null;}catch{return null;}}
 const banner=valid(ads.bannerScript),pop=valid(ads.popunderURL),direct=valid(ads.directURL);
 const path=location.pathname.replace(/\/+$/,'')||'/';
 if(banner||direct){
  const target=path==='/'?document.querySelector('#section-70-529'):path==='/iptv-player'?document.querySelector('.channel-sidebar'):['/x','/twitch'].includes(path)?document.querySelector('.social-actions'):null;
  if(target){const slot=document.createElement('aside');slot.className='hilltop-banner';slot.setAttribute('aria-label','Advertisement');slot.innerHTML='<p>Advertisement</p>';if(direct){const a=document.createElement('a');a.href=direct;a.textContent='Visit sponsor';a.target='_blank';a.rel='sponsored noopener noreferrer';slot.append(a);}if(path==='/iptv-player')target.append(slot);else target.after(slot);
   const start=()=>{const script=document.createElement('script');script.settings={};script.async=true;script.referrerPolicy='no-referrer-when-downgrade';script.src=banner;script.onerror=()=>{script.remove();if(!direct)slot.remove();};slot.append(script);};
   if(!banner)return;
   if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>{if(entries.some(x=>x.isIntersecting)){io.disconnect();start();}},{rootMargin:'200px'});io.observe(slot);}else start();
  }
 }
 if(pop){
  const key='plasmax-hilltop-popunder-last',interval=Math.max(24,Number(ads.popunderIntervalHours)||24)*3600000;let tried=false;
  document.addEventListener('click',event=>{
   if(tried||!event.isTrusted||event.defaultPrevented||event.target.closest('a,button,input,select,textarea,summary,video,[role="button"],.plasma-video-frame,.hilltop-banner'))return;
   let last=0;try{last=Number(localStorage.getItem(key))||0;}catch{}
   if(Date.now()-last<interval){tried=true;return;}
   tried=true;try{localStorage.setItem(key,String(Date.now()));}catch{}
   window.open(pop,'_blank','noopener,noreferrer');
  },{passive:true});
 }
})();

