'use strict';
(function(){
 function send(event){const body=JSON.stringify({event});if(navigator.sendBeacon){navigator.sendBeacon('/api/iptv-event',new Blob([body],{type:'application/json'}));}else fetch('/api/iptv-event',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});}
 try{if(!sessionStorage.getItem('plasmax-iptv-visit')){sessionStorage.setItem('plasmax-iptv-visit','1');send('visit');}}catch{send('visit');}
 let previous='',last=0;document.addEventListener('playing',function(e){const video=e.target;if(!(video instanceof HTMLVideoElement)||video.id!=='iptv-video')return;const current=document.querySelector('#current-channel')?.textContent||'';if(current===previous&&Date.now()-last<60000)return;previous=current;last=Date.now();send('play');},true);
})();
