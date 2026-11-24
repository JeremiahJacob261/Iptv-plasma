'use strict';
(function(){
 const tag=document.getElementById('plasma-config');let ads;try{ads=JSON.parse(tag.textContent).advertising;}catch{return;}
 if(!ads?.enabled||ads.provider!=='hilltop')return;
 function valid(value){try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='admired-raise.com'?u.href:null;}catch{return null;}}
 const banner=valid(ads.bannerScript);
 const path=location.pathname.replace(/\/+$/,'')||'/';
 const style=document.createElement('link');style.rel='stylesheet';style.href='/ads.css';document.head.append(style);
 // The supplied Hilltop tag is a 300x250 unit and only initializes once per
 // window. Give additional placements their own document so each can render.
 function isolatedBanner(source=banner){
  const frame=document.createElement('iframe');
  frame.className='watch-ad-frame';frame.title='Advertisement';frame.loading='lazy';
  frame.setAttribute('sandbox','allow-scripts allow-popups allow-popups-to-escape-sandbox');
  const safe=source.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  frame.srcdoc='<!doctype html><html><head><meta name="referrer" content="no-referrer-when-downgrade"><style>html,body{margin:0;width:300px;height:250px;overflow:hidden;background:#100d15}</style></head><body><script async src="'+safe+'"><\/script></body></html>';
  return frame;
 }
 function adPlacement(className){
  const slot=document.createElement('aside');slot.className='watch-ad '+className;slot.setAttribute('aria-label','Advertisement');
  const label=document.createElement('span');label.textContent='Advertisement';slot.append(label,isolatedBanner());return slot;
 }
 if ((path === '/' || path === '/iptv-player' || path === '/iptv') && banner) {
  const player = document.querySelector('#watch-player');
  if (player) player.after(adPlacement('sitewide-ad player-banner'));
 }
 if(banner&&!['/','/iptv','/iptv-player','/x','/twitch'].includes(path)){
  const content=document.querySelector('.ct-inner-content, main, article')||document.querySelector('header');
  if(content){
   const paragraphs=[...content.querySelectorAll('p')].filter(p=>p.textContent.trim().length>80);
   const first=paragraphs[0],middle=paragraphs.length>3?paragraphs[Math.floor(paragraphs.length/2)]:null;
   if(first)first.after(adPlacement('sitewide-ad'));else content.after(adPlacement('sitewide-ad'));
   if(middle)middle.after(adPlacement('sitewide-ad'));
  }
 }

})();




