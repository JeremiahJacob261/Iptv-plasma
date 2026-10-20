const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('/tmp/iptv-tests/node_modules/jsdom');
const app=fs.readFileSync('dist/app.js','utf8');
const html=fs.readFileSync('dist/iptv-player/index.html','utf8');
const catalog=JSON.parse(fs.readFileSync('dist/playlist-sources.json','utf8'));
const sample='#EXTM3U\n#EXTINF:-1 tvg-logo="https://example.com/logo.png" group-title="News",Channel One\nhttps://example.com/one.m3u8\n#EXTINF:-1 group-title="Sports",Channel Two\nhttp://example.com/two.m3u8\n#EXTINF:-1 group-title="News",News Three\nhttps://example.com/three.m3u8';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup({playlist=sample, apiError=null, noTimeout=false, savedFavorites=null}={}){
 const dom=new JSDOM(html,{url:'https://player.example/iptv-player/',runScripts:'outside-only'}),w=dom.window;
 const requests=[],instances=[];
 w.HTMLElement.prototype.scrollIntoView=function(){throw TypeError('Unsupported scrolling');};
 w.HTMLMediaElement.prototype.pause=function(){this._paused=true;};
 w.HTMLMediaElement.prototype.load=function(){};
 w.HTMLMediaElement.prototype.play=function(){this._paused=false;return Promise.resolve();};
 w.HTMLMediaElement.prototype.canPlayType=()=>'';
 class FakeHls{
  static Events={MANIFEST_PARSED:'manifest',ERROR:'error'};
  static ErrorTypes={NETWORK_ERROR:'network',MEDIA_ERROR:'media'};
  static isSupported=()=>true;
  constructor(){this.handlers={};instances.push(this);}
  on(e,f){this.handlers[e]=f;}
  loadSource(url){this.url=url;}
  attachMedia(video){this.video=video;queueMicrotask(()=>this.handlers.manifest?.());}
  destroy(){this.destroyed=true;}
  recoverMediaError(){this.recovered=true;}
 }
 w.Hls=FakeHls;
 if(noTimeout)w.AbortSignal.timeout=undefined;
 if(savedFavorites!==null)w.localStorage.setItem('iptv-favorites',savedFavorites);
 w.fetch=async(url)=>{requests.push(url);if(url==='/playlist-sources.json')return {ok:true,json:async()=>catalog};return {ok:!apiError,json:async()=>apiError?{error:apiError}:{text:playlist,url:'https://source.example/list.m3u'}};};
 w.eval(app+'\nwindow.loadPlaylist=loadPlaylist;window.parsePlaylist=parsePlaylist;');return {dom,w,requests,instances};
}
test('directory playlist loads through same-origin API without AbortSignal.timeout or scrolling support',async()=>{
 const s=setup({noTimeout:true,savedFavorites:'{"invalid":"value"}'});
 try{
  await s.w.loadPlaylist('https://iptv-org.github.io/iptv/countries/ng.m3u');
  assert(s.requests.some(url=>url.startsWith('/api/playlist?url=')));
  assert.equal(s.w.document.querySelectorAll('.channel-row').length,3);
  assert.match(s.w.document.querySelector('#player-status').textContent,/3 channels loaded/);
  assert.equal(s.w.document.querySelector('#m3u-form button').disabled,false);
 }finally{s.dom.window.close();}
});
test('real country/category/language playlists parse and render without mislabeling UI errors as CORS',async()=>{
 for(const file of ['/tmp/iptv-ng.m3u','/tmp/iptv-us.m3u','/tmp/iptv-news.m3u','/tmp/iptv-english.m3u']){
  const s=setup({playlist:fs.readFileSync(file,'utf8')});
  try{await s.w.loadPlaylist('https://example.com/list.m3u');assert.match(s.w.document.querySelector('#player-status').textContent,/channels loaded/);assert(s.w.document.querySelectorAll('.channel-row').length>0);}finally{s.dom.window.close();}
 }
});
test('search, groups, favorite add/remove, persistence, empty result and playlist replacement',async()=>{
 const s=setup();const d=s.w.document;
 try{
  await s.w.loadPlaylist('https://source.example/list.m3u');
  d.querySelector('#channel-search').value='one';d.querySelector('#channel-search').dispatchEvent(new s.w.Event('input'));
  assert.equal(d.querySelectorAll('.channel-row').length,1);
  d.querySelector('.channel-favorite').click();assert.equal(JSON.parse(s.w.localStorage.getItem('iptv-favorites')).length,1);
  d.querySelector('#channel-search').value='';d.querySelector('#channel-search').dispatchEvent(new s.w.Event('input'));
  d.querySelector('#favorites-only').checked=true;d.querySelector('#favorites-only').dispatchEvent(new s.w.Event('change'));assert.equal(d.querySelectorAll('.channel-row').length,1);
  d.querySelector('.channel-favorite').click();assert.match(d.querySelector('#channel-list').textContent,/No channels/);
  d.querySelector('#favorites-only').checked=false;d.querySelector('#favorites-only').dispatchEvent(new s.w.Event('change'));
  d.querySelector('#channel-group').value='News';d.querySelector('#channel-group').dispatchEvent(new s.w.Event('change'));assert.equal(d.querySelectorAll('.channel-row').length,2);
  await s.w.loadPlaylist('https://source.example/next.m3u');assert.equal(d.querySelector('#channel-group').value,'');assert.equal(d.querySelectorAll('.channel-row').length,3);
 }finally{s.dom.window.close();}
});
test('HLS switching, direct-to-relay fallback, HTTP compatibility, fatal errors and Stop',async()=>{
 const s=setup(),d=s.w.document;
 try{
  await s.w.loadPlaylist('https://source.example/list.m3u');d.querySelector('.channel-play').click();await tick();
  const first=s.instances.at(-1);assert.equal(first.url,'https://example.com/one.m3u8');
  first.handlers.error(null,{fatal:true,type:'network'});await tick();const relay=s.instances.at(-1);assert(first.destroyed);assert.match(relay.url,/^\/api\/stream\?url=/);
  relay.handlers.error(null,{fatal:true,type:'network',response:{code:403}});await tick();assert.match(d.querySelector('#stream-status').textContent,/HTTP 403/);
  d.querySelectorAll('.channel-play')[1].click();await tick();assert(relay.destroyed);assert.match(s.instances.at(-1).url,/^\/api\/stream\?url=http/);
  d.querySelector('#stop-playback').click();assert(s.instances.at(-1).destroyed);assert.match(d.querySelector('#stream-status').textContent,/stopped/);assert.equal(d.querySelector('video').hasAttribute('src'),false);
  d.querySelector('#player-http').checked=true;d.querySelector('.channel-play').click();await tick();assert.match(s.instances.at(-1).url,/^\/api\/stream\?url=/);
 }finally{s.dom.window.close();}
});
test('uploads, quoted metadata commas, unsafe URLs, malformed data and service failure',async()=>{
 const s=setup();
 try{
  const parsed=s.w.parsePlaylist('#EXTM3U\n#EXTINF:-1 tvg-name="Name, With Comma",Visible Name\nhttps://example.com/live');assert.equal(parsed[0].name,'Visible Name');
  await s.w.loadPlaylist('',{size:sample.length,text:async()=>sample});assert.match(s.w.document.querySelector('#player-status').textContent,/3 channels/);
  await s.w.loadPlaylist('file:///etc/passwd');assert.match(s.w.document.querySelector('#player-status').textContent,/HTTP or HTTPS/);
  await s.w.loadPlaylist('',{size:9e6,text:async()=>sample});assert.match(s.w.document.querySelector('#player-status').textContent,/too large/);
  await s.w.loadPlaylist('',{size:10,text:async()=>'<html>error</html>'});assert.match(s.w.document.querySelector('#player-status').textContent,/No playable channels/);
 }finally{s.dom.window.close();}
 const failed=setup({apiError:'This playlist is no longer available (404).'});try{await failed.w.loadPlaylist('https://source.example/removed.m3u');assert.match(failed.w.document.querySelector('#player-status').textContent,/404/);assert.equal(failed.w.document.querySelector('#m3u-form button').disabled,false);}finally{failed.dom.window.close();}
});
test('large playlists render progressively and searches cover channels beyond first page',async()=>{
 const s=setup({playlist:'#EXTM3U\n'+Array.from({length:230},(_,i)=>`#EXTINF:-1,Station ${i}\nhttps://example.com/${i}.m3u8`).join('\n')});
 try{await s.w.loadPlaylist('https://source.example/list.m3u');const d=s.w.document;assert.equal(d.querySelectorAll('.channel-row').length,100);d.querySelector('#load-more-channels').click();assert.equal(d.querySelectorAll('.channel-row').length,200);d.querySelector('#channel-search').value='Station 229';d.querySelector('#channel-search').dispatchEvent(new s.w.Event('input'));assert.equal(d.querySelectorAll('.channel-row').length,1);}finally{s.dom.window.close();}
});

test('official default source loads automatically and source picker searches and loads a country',async()=>{
 const s=setup(),d=s.w.document;
 try{
  await tick();
  assert(s.requests.some(url=>url==='/api/playlist?url='+encodeURIComponent('https://iptv-org.github.io/iptv/index.category.m3u')));
  assert.equal(d.querySelector('#playlist-url').value,'https://iptv-org.github.io/iptv/index.category.m3u');
  assert(d.querySelector('#builtin-playlist').options.length>1000);
  const search=d.querySelector('#playlist-source-search');search.value='Nigeria';search.dispatchEvent(new s.w.Event('input'));
  const select=d.querySelector('#builtin-playlist');const option=[...select.options].find(x=>x.value.endsWith('/countries/ng.m3u'));assert(option);
  select.value=option.value;select.dispatchEvent(new s.w.Event('change'));d.querySelector('#load-builtin-playlist').click();await tick();
  assert(s.requests.some(url=>url.endsWith(encodeURIComponent('/countries/ng.m3u'))));
  assert.equal(d.querySelector('#playlist-file').value,'');
 }finally{s.dom.window.close();}
});
test('both user-supplied aggregate playlists parse, deduplicate feeds, and retain selectable categories',async()=>{
 for(const file of ['/tmp/iptv-org-main','/tmp/iptv-org-category']){
  const s=setup({playlist:fs.readFileSync(file,'utf8')});
  try{
   await s.w.loadPlaylist('https://iptv-org.github.io/iptv/index.category.m3u');
   const parsed=s.w.parsePlaylist(fs.readFileSync(file,'utf8'),'https://iptv-org.github.io/iptv/index.category.m3u');
   assert(parsed.length>10000);assert.equal(new Set(parsed.map(x=>x.url)).size,parsed.length);
   const d=s.w.document;assert.equal(d.querySelectorAll('.channel-row').length,100);
   assert([...d.querySelector('#channel-group').options].some(x=>x.value==='News'));
   d.querySelector('#channel-group').value='News';d.querySelector('#channel-group').dispatchEvent(new s.w.Event('change'));
   assert(d.querySelectorAll('.channel-row').length>0);
  }finally{s.dom.window.close();}
 }
});
test('repeated stream URLs merge category memberships',async()=>{
 const text='#EXTM3U\n#EXTINF:-1 group-title="News",Station\nhttps://example.com/live.m3u8\n#EXTINF:-1 group-title="General",Station\nhttps://example.com/live.m3u8';
 const s=setup({playlist:text});try{await s.w.loadPlaylist('https://example.com/list.m3u');const parsed=s.w.parsePlaylist(text);assert.equal(parsed.length,1);assert.equal(parsed[0].group,'News;General');for(const group of ['News','General']){const select=s.w.document.querySelector('#channel-group');select.value=group;select.dispatchEvent(new s.w.Event('change'));assert.equal(s.w.document.querySelectorAll('.channel-row').length,1);}}finally{s.dom.window.close();}
});

test('same-station alternatives are tried without switching to a different channel',async()=>{
 const list='#EXTM3U\n#EXTINF:-1 tvg-id="Station.us@SD",Station\nhttps://example.com/blocked.m3u8\n#EXTINF:-1 tvg-id="Station.us@HD",Station HD\nhttps://backup.example.com/live.m3u8\n#EXTINF:-1 tvg-id="Different.us@SD",Different Station\nhttps://other.example.com/live.m3u8';
 const s=setup({playlist:list}),d=s.w.document;
 try{
  await s.w.loadPlaylist('https://example.com/list.m3u');d.querySelector('.channel-play').click();await tick();
  let player=s.instances.at(-1);assert.equal(player.url,'https://example.com/blocked.m3u8');
  player.handlers.error(null,{fatal:true,type:'network',response:{code:403}});await tick();player=s.instances.at(-1);assert.match(player.url,/api\/stream/);
  player.handlers.error(null,{fatal:true,type:'network',response:{code:403}});await tick();player=s.instances.at(-1);assert.equal(player.url,'https://backup.example.com/live.m3u8');
  assert.equal(d.querySelector('#channel-source').href,'https://backup.example.com/live.m3u8');
  assert.equal(d.querySelectorAll('#watch-player iframe').length,0);assert.equal(d.querySelector('#watch-player video').tagName,'VIDEO');
  d.querySelector('video').onplaying();assert.match(d.querySelector('#stream-status').textContent,/alternative public feed/);
 }finally{s.dom.window.close();}
});
test('playlist station IDs and declared request headers are retained and used by the relay',async()=>{
 const list='#EXTM3U\n#EXTINF:-1 tvg-id="Station.us@SD" http-user-agent="Example Player",Station\n#EXTVLCOPT:http-referrer=https://provider.example.com/player\nhttps://cdn.example.com/live.m3u8';
 const s=setup({playlist:list});try{
  await s.w.loadPlaylist('https://example.com/list.m3u');const parsed=s.w.parsePlaylist(list);assert.equal(parsed[0].id,'Station.us@SD');assert.equal(parsed[0].userAgent,'Example Player');assert.equal(parsed[0].referer,'https://provider.example.com/player');
  s.w.document.querySelector('.channel-play').click();await tick();assert.match(s.instances.at(-1).url,/ua=Example%20Player/);assert.match(s.instances.at(-1).url,/referrer=https%3A%2F%2Fprovider/);
 }finally{s.dom.window.close();}
});
test('explicit full-screen control targets the video element',async()=>{
 const s=setup(),d=s.w.document;try{await s.w.loadPlaylist('https://example.com/list.m3u');let calls=0;d.querySelector('video').requestFullscreen=async()=>{calls++;};d.querySelector('#fullscreen-playback').click();await tick();assert.equal(calls,1);}finally{s.dom.window.close();}
});
