'use strict';
(function(){
 const tag=document.getElementById('plasma-config');let ads;try{ads=JSON.parse(tag.textContent).advertising;}catch{return;}
 if(!ads?.enabled||ads.provider!=='hilltop')return;
 function valid(value){try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='admired-raise.com'?u.href:null;}catch{return null;}}
 const banner=valid(ads.bannerScript),pop=valid(ads.popunderURL),direct=valid(ads.directURL);
 const path=location.pathname.replace(/\/+$/,'')||'/';
 // The supplied Hilltop tag is a 300x250 unit and only initializes once per
 // window. Give additional placements their own document so each can render.
 function isolatedBanner(){
  const frame=document.createElement('iframe');
  frame.className='watch-ad-frame';frame.title='Advertisement';
  frame.setAttribute('sandbox','allow-scripts allow-popups allow-popups-to-escape-sandbox');
  const safe=banner.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  frame.srcdoc='<!doctype html><html><head><meta name="referrer" content="no-referrer-when-downgrade"><style>html,body{margin:0;width:300px;height:250px;overflow:hidden;background:#100d15}</style></head><body><script async src="'+safe+'"><\/script></body></html>';
  return frame;
 }
 function adPlacement(className){
  const slot=document.createElement('aside');slot.className='watch-ad '+className;slot.setAttribute('aria-label','Advertisement');
  const label=document.createElement('span');label.textContent='Advertisement';slot.append(label,isolatedBanner());return slot;
 }
 if(path==='/iptv-player'&&banner){
  const player=document.querySelector('#watch-player'),pane=player?.querySelector('.video-pane');
  if(player&&pane){
   const top=adPlacement('watch-ad-top');player.before(top);
   const stage=document.createElement('div');stage.className='watch-stage';pane.before(stage);
   stage.append(adPlacement('watch-ad-left'),pane,adPlacement('watch-ad-right'));
   const dialog=document.createElement('dialog');dialog.className='watch-ad-break';dialog.setAttribute('aria-label','Advertisement break');
   const content=document.createElement('div');content.className='watch-ad-break-content';
   const title=document.createElement('p');title.textContent='Advertisement';
   const close=document.createElement('button');close.type='button';close.className='watch-ad-close';close.textContent='Close ad';close.setAttribute('aria-label','Close advertisement');
   const ad=document.createElement('div');ad.className='watch-ad-break-unit';content.append(close,title,ad);dialog.append(content);document.body.append(dialog);
   let timer,pending=false;
   const schedule=()=>{clearTimeout(timer);timer=setTimeout(showBreak,(10+Math.random()*25)*60*1000);};
   function showBreak(){if(document.hidden){pending=true;return;}pending=false;ad.replaceChildren(isolatedBanner());if(!dialog.open)dialog.showModal();}
   close.addEventListener('click',()=>dialog.close());
   dialog.addEventListener('close',()=>{ad.replaceChildren();schedule();});
   document.addEventListener('visibilitychange',()=>{if(!document.hidden&&pending&&!dialog.open)showBreak();});
   schedule();
  }
 }
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


