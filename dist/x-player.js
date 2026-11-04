'use strict';
window.initXViewer=window.initMediaViewer=function(root){
 const platform=root.dataset.platform==='twitch'?'twitch':'x',brand=platform==='twitch'?'Twitch':'X';
 const form=root.querySelector('#social-form'),input=root.querySelector('#social-url'),embed=root.querySelector('#social-embed'),status=root.querySelector('#social-status'),original=root.querySelector('#social-original'),clear=root.querySelector('#social-clear');
 setControlLabel(form.querySelector('button'),'Load video','play');setControlLabel(clear,'Clear viewer','stop');
 let epoch=0,request,hls,video,playEpoch=0,disposePlayer;
 function stopPlayer(){playEpoch++;hls?.destroy();hls=null;if(video){video.pause();video.removeAttribute('src');video.load();}disposePlayer?.();disposePlayer=null;video=null;}
 function reset(){epoch++;request?.abort();request=null;stopPlayer();embed.replaceChildren();root.querySelector('.viewer-placeholder')?.removeAttribute('hidden');clear.hidden=true;original.hidden=true;root.setAttribute('aria-busy','false');setControlLabel(form.querySelector('button'),'Load video','play');}
 clear.addEventListener('click',()=>{reset();status.textContent='Viewer cleared. Paste another '+brand+' video link to continue.';});
 function el(tag,className,value){const node=document.createElement(tag);if(className)node.className=className;if(value)node.textContent=value;return node;}
 function render(data,version){
  const panel=el('article','x-native-player'),media=el('div','x-media-frame'),info=el('div','x-video-info'),byline=el('div','x-byline'),identity=el('div','x-identity');
  panel.setAttribute('aria-label',brand+' video and creator details');root.querySelector('.viewer-placeholder')?.setAttribute('hidden','');
  if(data.author?.avatar){const avatar=el('img','x-avatar');avatar.src=data.author.avatar;avatar.alt='';avatar.referrerPolicy='no-referrer';avatar.addEventListener('error',()=>avatar.remove());byline.append(avatar);}
  identity.append(el('strong','x-author',data.author?.name||brand+' creator'));
  if(data.author?.username){identity.append(el('span','x-handle','@'+data.author.username));}byline.append(identity);
  const state=el('span','x-video-state',data.state==='live'?'Live':data.state==='replay'?'Replay':'Video');byline.append(state);info.append(byline,el('p','x-video-title',data.title));
  const facts=el('div','media-facts');if(data.category)facts.append(el('span','',data.category));if(Number.isFinite(data.viewers))facts.append(el('span','',new Intl.NumberFormat().format(data.viewers)+' viewers'));if(facts.children.length)info.append(facts);
  if(data.createdAt&&!Number.isNaN(Date.parse(data.createdAt))){const date=el('time','x-published',new Date(data.createdAt).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}));date.dateTime=data.createdAt;info.append(date);}
  original.hidden=true;clear.hidden=false;
  if(!data.videos?.length){state.textContent='Post';panel.append(info);embed.append(panel);status.textContent='This public post has no playable video. Paste a video post or live broadcast link.';return;}
  video=el('video','x-video');video.id=platform+'-video';video.controls=true;video.playsInline=true;video.preload='metadata';video.setAttribute('aria-label',brand+' video player');media.append(video);panel.append(media,info);embed.append(panel);
  const controls=el('div','x-player-controls'),full=el('button'),stop=el('button');full.type=stop.type='button';setControlLabel(full,'Full screen','arrows-pointing-out');setControlLabel(stop,'Stop','stop');controls.append(full,stop);info.append(controls);
  const currentVideo=video;
  full.addEventListener('click',()=>{try{const action=(currentVideo.closest('[data-plasma-player]')||currentVideo).requestFullscreen?.()||currentVideo.webkitEnterFullscreen?.();action?.catch(()=>{status.textContent='Use the full-screen control inside the video player.';});}catch{status.textContent='Use the full-screen control inside the video player.';}});
  stop.addEventListener('click',()=>{currentVideo.pause();if(Number.isFinite(currentVideo.duration))currentVideo.currentTime=0;status.textContent='Playback stopped. Press Play to resume.';});
  let selected=Math.min(data.initialIndex||0,data.videos.length-1),quality,clip;
  if(data.videos.length>1){const label=el('label','x-select-label','Video');clip=el('select');clip.setAttribute('aria-label','Select video from this post');data.videos.forEach((_,i)=>clip.append(new Option('Video '+(i+1),String(i))));clip.value=String(selected);label.append(clip);controls.prepend(label);clip.addEventListener('change',()=>{selected=Number(clip.value);populate();load(false);});}
  const label=el('label','x-select-label','Quality');quality=el('select');quality.setAttribute('aria-label','Video quality');label.append(quality);controls.prepend(label);
  function populate(){quality.replaceChildren();data.videos[selected].sources.forEach((s,i)=>quality.append(new Option(s.label,String(i))));currentVideo.poster=data.videos[selected].poster||'';}
  let detachMedia=()=>{};
  async function load(relay,resume=0,shouldPlay=false){
   if(version!==epoch)return;const local=++playEpoch;detachMedia();hls?.destroy();hls=null;currentVideo.pause();currentVideo.removeAttribute('src');currentVideo.load();
   const source=data.videos[selected].sources[Number(quality.value)||0];if(!source)return;const url=relay?'/api/stream?url='+encodeURIComponent(source.url):source.url;
   const alive=()=>version===epoch&&local===playEpoch;
   let failed=false;
   const error=()=>{if(!alive()||failed)return;failed=true;if(!relay){status.textContent='Trying a compatible connection…';load(true,resume,shouldPlay);}else status.textContent='The '+brand+' media stream could not be played. Load the link again to refresh it, or try another video.';};
   const ready=()=>{if(!alive())return;if(resume&&Number.isFinite(currentVideo.duration))currentVideo.currentTime=Math.min(resume,currentVideo.duration);if(shouldPlay)currentVideo.play()?.catch(()=>{if(alive())status.textContent='Press Play to continue.';});};
   currentVideo.addEventListener('error',error);currentVideo.addEventListener('loadedmetadata',ready,{once:true});detachMedia=()=>{currentVideo.removeEventListener('error',error);currentVideo.removeEventListener('loadedmetadata',ready);};
   try{
    if(source.type==='hls'&&!currentVideo.canPlayType('application/vnd.apple.mpegurl')){const H=await ensureHls();if(!alive())return;if(!H.isSupported())throw Error('unsupported');hls=new H({manifestLoadingTimeOut:15000,fragLoadingTimeOut:20000});hls.on(H.Events.ERROR,(_,event)=>{if(event.fatal)error();});hls.loadSource(url);hls.attachMedia(currentVideo);}else currentVideo.src=url;
   }catch{error();}
  }
  quality.addEventListener('change',()=>{const resume=currentVideo.currentTime,playing=!currentVideo.paused;load(false,resume,playing);});
  currentVideo.addEventListener('playing',()=>{if(version===epoch)status.textContent=data.state==='live'?'Watching live.':'Playing video.';});
  disposePlayer=()=>detachMedia();populate();load(false);status.textContent=data.state==='live'?'Live stream ready. Press Play to watch.':'Video ready. Press Play to watch.';
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();reset();const version=epoch;request=new AbortController();const controller=request;const timeout=setTimeout(()=>controller.abort(),45000);status.textContent='Loading video and creator details…';root.setAttribute('aria-busy','true');setControlLabel(form.querySelector('button'),'Loading…','arrow-path');
  try{const response=await fetch('/api/'+platform+'-media?url='+encodeURIComponent(input.value.trim()),{signal:request.signal});const data=await response.json();if(version!==epoch)return;if(!response.ok)throw Error(data.error||brand+' could not make this video available.');render(data,version);}
  catch(error){if(version===epoch)status.textContent=error.name==='AbortError'?brand+' took too long to respond. Try loading the link again.':error.message;}
  finally{clearTimeout(timeout);if(version===epoch){request=null;root.setAttribute('aria-busy','false');setControlLabel(form.querySelector('button'),'Load video','play');}}
 });
 const initial=new URLSearchParams(location.search).get('url');if(initial){input.value=initial;form.requestSubmit();}
};
