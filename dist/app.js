'use strict';
const store = {
 get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
 set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
};
function parsePlaylist(text, base = location.href) {
 text = text.replace(/^\uFEFF/, '');
 if (/^#EXTM3U/m.test(text) && /#EXT-X-(TARGETDURATION|STREAM-INF|MEDIA-SEQUENCE)/.test(text)) return [{ name: 'Live Stream', url: base, group: '', logo: '', id: '', userAgent: '', referer: '', type: 'hls' }];
 const channels = [], byURL = new Map(); let info = {};
 for (const line of text.split(/\r?\n/).map(x => x.trim())) {
  if (line.startsWith('#EXTINF:')) {
   const attrs = Object.fromEntries([...line.matchAll(/([\w-]+)="([^"]*)"/g)].map(x => [x[1], x[2]]));
   let quoted = false, comma = -1;
   for (let i = 0; i < line.length; i++) { if (line[i] === '"') quoted = !quoted; if (line[i] === ',' && !quoted) { comma = i; break; } }
   info = { name: (comma < 0 ? '' : line.slice(comma + 1).trim()) || attrs['tvg-name'] || 'Channel', logo: attrs['tvg-logo'] || '', group: attrs['group-title'] || '', id: attrs['tvg-id'] || '', userAgent: attrs['http-user-agent'] || '', referer: attrs['http-referrer'] || attrs['http-referer'] || '' };
  } else if (line.startsWith('#EXTVLCOPT:http-user-agent=')) {
   info.userAgent=line.slice(line.indexOf('=')+1);
  } else if (/^#EXTVLCOPT:http-referr?er=/.test(line)) {
   info.referer=line.slice(line.indexOf('=')+1);
  } else if (line && !line.startsWith('#')) {
   if (/[<>]/.test(line) || (!info.name && !/^https?:\/\//i.test(line) && !/\.(?:m3u8?|mp4|mp3|aac|ts)(?:[?#]|$)/i.test(line))) continue;
   try {
    const url = new URL(line, base);
    if (/^https?:$/.test(url.protocol)) {
     const existing = byURL.get(url.href);
     if (existing) existing.group = [...new Set([...existing.group.split(';'),...(info.group || '').split(';')].filter(Boolean))].join(';');
     else { const channel = { name: info.name || 'Channel '+(channels.length+1), group: info.group || '', logo: info.logo || '', id: info.id || '', userAgent: info.userAgent || '', referer: info.referer || '', url: url.href }; channels.push(channel); byURL.set(url.href,channel); }
    }
   } catch {}
   info = {};
  }
 }
 return channels;
}
const form = document.querySelector('#m3u-form');
const DEFAULT_PLAYLIST = 'https://iptv-org.github.io/iptv/index.category.m3u';
let catalogPromise;
const savedFavorites = store.get('iptv-favorites', []);
let channels = [], hls, active, pageSize = 100, playAttempt = 0, loadAttempt = 0, playlistRequest;
const favorites = new Set(Array.isArray(savedFavorites) ? savedFavorites : []);
function safeScroll(element) { try { element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch {} }
function message(text, error = false) {
 let el = document.querySelector('#player-status');
 if (!el && form) { el = document.createElement('p'); el.id = 'player-status'; el.setAttribute('role', 'status'); form.after(el); }
 if (el) { el.textContent = text; el.classList.toggle('error', error); }
}
async function fetchWithTimeout(url, options = {}, timeout = 30000) {
 const controller = new AbortController();
 const timer = setTimeout(() => controller.abort(), timeout);
 if (options.signal) { if (options.signal.aborted) controller.abort(); else options.signal.addEventListener('abort', () => controller.abort(), { once: true }); }
 try { return await fetch(url, { ...options, signal: controller.signal }); } finally { clearTimeout(timer); }
}
async function fetchPlaylist(url, signal) {
 const response = await fetchWithTimeout('/api/playlist?url='+encodeURIComponent(url), { signal });
 const data = await response.json().catch(() => ({}));
 if (!response.ok) throw Error(data.error || 'The playlist server could not be reached. Please try again.');
 if (typeof data.text !== 'string') throw Error('The playlist server returned an invalid response. Please try again.');
 return data;
}
async function loadPlaylist(url, file) {
 const attempt = ++loadAttempt;
 playlistRequest?.abort(); playlistRequest = new AbortController();
 const button = form?.querySelector('[type=submit]');
 if (button) { button.disabled = true; button.textContent = 'Loading…'; }
 message('Loading playlist…');
 const sourceSelect = document.querySelector('#builtin-playlist');
 if (sourceSelect) sourceSelect.value = [...sourceSelect.options].some(option=>option.value===url) ? url : '';
 let nextChannels;
 try {
  let text, base = location.href;
  if (file) {
   if (file.size > 4 * 1024 * 1024) throw Error('This file is too large. Upload an M3U file smaller than 4 MB.');
   text = await file.text();
   if (/#EXT-X-/.test(text)) throw Error('For an HLS stream, paste its original URL so video segments can be loaded.');
  } else {
   let parsed;
   try { parsed = new URL(url); } catch { throw Error('Enter a valid HTTP or HTTPS playlist URL.'); }
   if (!['http:', 'https:'].includes(parsed.protocol)) throw Error('Enter an HTTP or HTTPS playlist URL.');
   const result = await fetchPlaylist(parsed.href, playlistRequest.signal); text = result.text; base = result.url || parsed.href;
  }
  nextChannels = parsePlaylist(text, base);
  if (!nextChannels.length) throw Error('No playable channels were found. Try another M3U playlist or directory selection.');
 } catch (error) {
  if (attempt !== loadAttempt) return;
  message(error.name === 'AbortError' ? 'The playlist took too long to respond. Please try again.' : error instanceof TypeError ? 'The playlist service could not be reached. Check your connection and try again.' : error.message, true);
  return;
 } finally {
  if (attempt === loadAttempt && button) { button.disabled = false; button.textContent = 'Watch'; }
 }
 if (attempt !== loadAttempt || !nextChannels) return;
 stopPlayback(false); channels = nextChannels; active = null; pageSize = 100;
 try {
  renderPlayer(); store.set('iptv-playlist', channels);
  message(channels.length+' channels loaded. Select a channel to watch.');
 } catch (error) { console.error('player_render_failed', error); message('The playlist loaded, but the player could not open. Refresh the page and try again.', true); }
}
function stopPlayback(showMessage = true) {
 ++playAttempt; hls?.destroy(); hls = null;
 const video = document.querySelector('#iptv-video');
 if (video) { video.onplaying = null; video.onerror = null; video.pause(); video.removeAttribute('src'); video.load(); }
 if (showMessage && document.querySelector('#stream-status')) { document.querySelector('#stream-status').textContent = 'Playback stopped.'; message(channels.length+' channels loaded. Playback stopped.'); }
}
function renderPlayer() {
 let panel = document.querySelector('#watch-player');
 if (!panel) {
  panel = document.createElement('section'); panel.id = 'watch-player'; panel.setAttribute('aria-label','IPTV channel player');
  panel.innerHTML = '<aside class="channel-sidebar"><input id="channel-search" type="search" placeholder="Filter Channels" aria-label="Filter Channels"><label class="favorite-filter"><input id="favorites-only" type="checkbox"> Favorite Channels</label><select id="channel-group" aria-label="Channel group"><option value="">All Channels</option></select><p id="channel-count" role="status"></p><div id="channel-list"></div><button id="load-more-channels" type="button" hidden>Load more channels</button></aside><div class="video-pane"><video id="iptv-video" controls playsinline preload="none"></video><div class="video-caption"><span id="current-channel">Select a channel to watch</span><span class="playback-actions"><button id="fullscreen-playback" type="button">Full screen</button><button id="stop-playback" type="button">Stop</button></span></div><p class="channel-source-line"><a id="channel-source" target="_blank" rel="noopener noreferrer" hidden>Channel source</a></p><p id="stream-status" role="status"></p></div>';
  document.querySelector('#player-status').after(panel);
  ['#channel-search','#favorites-only','#channel-group'].forEach(selector=>panel.querySelector(selector).addEventListener(selector==='#channel-search'?'input':'change',()=>{pageSize=100;renderChannels();}));
  panel.querySelector('#load-more-channels').addEventListener('click',()=>{pageSize+=100;renderChannels();});
  panel.querySelector('#stop-playback').addEventListener('click', () => stopPlayback());
  panel.querySelector('#fullscreen-playback').addEventListener('click', async()=>{
   const video=panel.querySelector('video');
   try{if(video.requestFullscreen)await video.requestFullscreen();else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();else document.querySelector('#stream-status').textContent='Use your browser’s video controls to enter full screen.';}catch{document.querySelector('#stream-status').textContent='Full screen was blocked. Tap the video’s full-screen control.';}
  });
 }
 const group = panel.querySelector('#channel-group'); group.replaceChildren(new Option('All Channels',''));
 [...new Set(channels.flatMap(x=>x.group.split(';')).filter(Boolean))].sort().forEach(x=>group.add(new Option(x,x)));
 panel.querySelector('#channel-search').value=''; panel.querySelector('#favorites-only').checked=false;
 panel.querySelector('#current-channel').textContent='Select a channel to watch'; panel.querySelector('#stream-status').textContent=''; panel.querySelector('#channel-source').hidden=true;
 renderChannels(); safeScroll(panel);
}
function renderChannels() {
 const query = document.querySelector('#channel-search').value.toLowerCase(), group = document.querySelector('#channel-group').value, only = document.querySelector('#favorites-only').checked;
 const list = document.querySelector('#channel-list'); list.replaceChildren();
 const filtered = channels.filter(x => x.name.toLowerCase().includes(query) && (!group || x.group.split(';').includes(group)) && (!only || favorites.has(x.url)));
 document.querySelector('#channel-count').textContent = filtered.length+' channels';
 document.querySelector('#load-more-channels').hidden = filtered.length <= pageSize;
 if (!filtered.length) { const p = document.createElement('p'); p.textContent = 'No channels match your filters.'; list.append(p); }
 const fragment = document.createDocumentFragment();
 filtered.slice(0,pageSize).forEach(channel => {
  const row = document.createElement('div'); row.className = 'channel-row'; row.classList.toggle('active', active === channel.url);
  const play = document.createElement('button'); play.type = 'button'; play.className = 'channel-play';
  if (/^https?:\/\//i.test(channel.logo)) { const image = document.createElement('img'); image.src = channel.logo; image.alt = ''; image.loading = 'lazy'; image.addEventListener('error',()=>image.remove(),{once:true}); play.append(image); }
  const name = document.createElement('span'); name.textContent = channel.name; play.append(name); play.addEventListener('click',()=>playChannel(channel));
  const fav = document.createElement('button'); fav.type = 'button'; fav.className = 'channel-favorite'; fav.setAttribute('aria-label',(favorites.has(channel.url)?'Remove from':'Add to')+' favorites: '+channel.name); fav.setAttribute('aria-pressed',String(favorites.has(channel.url))); fav.innerHTML = '<svg width="19" height="19" viewBox="0 0 24 24" fill="'+(favorites.has(channel.url)?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.6l6.2-.9Z"/></svg>';
  fav.addEventListener('click',()=>{favorites.has(channel.url)?favorites.delete(channel.url):favorites.add(channel.url);store.set('iptv-favorites',[...favorites]);renderChannels();});
  row.append(play,fav);fragment.append(row);
 }); list.append(fragment);
}
let hlsLibrary;
function ensureHls() {
 if (window.Hls) return Promise.resolve(window.Hls);
 if (!hlsLibrary) hlsLibrary = new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='/hls.min.js';script.onload=()=>window.Hls?resolve(window.Hls):reject(Error('The video library could not load. Refresh the page.'));script.onerror=()=>{hlsLibrary=null;script.remove();reject(Error('The video library could not load. Check your connection and retry.'));};document.head.append(script);
 });
 return hlsLibrary;
}
function stationKey(channel) {
 return channel.id ? channel.id.split('@')[0].toLowerCase() : 'name:'+channel.name.replace(/\[[^\]]*\]/g,'').replace(/\((?:\d+p|\d+x\d+|hd|sd|uhd|4k)\)/gi,'').replace(/\s+/g,' ').trim().toLowerCase();
}
let alternateCatalog;
async function alternateFeeds(channel,tried) {
 const key=stationKey(channel),same=feed=>stationKey(feed)===key&&!tried.has(feed.url);
 let matches=channels.filter(same);
 if(matches.length<2){
  try{
   if(!alternateCatalog)alternateCatalog=fetchPlaylist('https://iptv-org.github.io/iptv/index.m3u').then(data=>parsePlaylist(data.text,data.url)).catch(error=>{alternateCatalog=null;throw error;});
   matches=matches.concat((await alternateCatalog).filter(same));
  }catch{}
 }
 return [...new Map(matches.map(feed=>[feed.url,feed])).values()].sort((a,b)=>Number(/\[Geo-blocked\]/i.test(a.name))-Number(/\[Geo-blocked\]/i.test(b.name)));
}
function playbackFailure(data) {
 const body=data?.response?.data;
 try{const parsed=typeof body==='string'?JSON.parse(body):body;if(typeof parsed?.error==='string')return parsed.error;}catch{}
 const code=Number(data?.response?.code||data?.response?.status);
 if(code===401||code===403)return 'The provider refused this feed (HTTP '+code+'). It may require authorization or an allowed location.';
 if(code===451)return 'The provider reports a legal or location restriction (HTTP 451).';
 if(code===404||code===410)return 'The provider removed this feed or its URL has expired (HTTP '+code+').';
 if(code===429)return 'The provider is limiting connections (HTTP 429).';
 if(data?.type==='mediaError')return 'The browser could not decode this feed’s audio or video.';
 return 'The media source did not respond with playable video.';
}
function channelRelayURL(channel) {
 return '/api/stream?url='+encodeURIComponent(channel.url)+(channel.userAgent?'&ua='+encodeURIComponent(channel.userAgent):'')+(channel.referer?'&referrer='+encodeURIComponent(channel.referer):'');
}
async function playChannel(channel) {
 stopPlayback(false);const attempt=playAttempt;
 active=channel.url;renderChannels();
 message(channels.length+' channels loaded. Connecting to '+channel.name+'.');
 const video=document.querySelector('#iptv-video'),status=document.querySelector('#stream-status'),source=document.querySelector('#channel-source');
 document.querySelector('#current-channel').textContent=channel.name;status.textContent='Connecting directly to the channel…';
 let feed=channel,proxied=forceRelay(feed),connection=0,recoveredMedia=false,fallbackBusy=false,lastFailure='',alternatives;
 const tried=new Set([channel.url]);
 let HlsClass;
 function forceRelay(item){return item.url.startsWith('http:')||Boolean(item.userAgent||item.referer)||document.querySelector('#player-http')?.checked;}
 const current=epoch=>attempt===playAttempt&&epoch===connection;
 const connect=async()=>{
  if(attempt!==playAttempt)return;
  const epoch=++connection;fallbackBusy=false;recoveredMedia=false;
  video.onerror=null;video.onplaying=null;hls?.destroy();hls=null;video.pause();video.removeAttribute('src');video.load();
  source.href=feed.url;source.textContent='Channel source: '+new URL(feed.url).hostname;source.hidden=false;
  const isHls=feed.type==='hls'||!/\.(?:mp4|mp3|aac|webm|ogg|mov|ts)(?:[?#]|$)/i.test(feed.url);
  const start=()=>{if(!current(epoch))return;Promise.resolve(video.play()).catch(error=>{if(!current(epoch)||error.name==='AbortError')return;if(error.name==='NotAllowedError')status.textContent='Press Play in the video controls to start watching.';else fallback({type:'mediaError'},epoch);});};
  video.onplaying=()=>{if(current(epoch)){status.textContent=tried.size>1?'Playing an alternative public feed of this channel.':'Playing live';message(channels.length+' channels loaded. Now playing '+channel.name+'.');}};
  try{
   if(isHls&&!video.canPlayType('application/vnd.apple.mpegurl'))HlsClass=await ensureHls();
   if(!current(epoch))return;
   const url=proxied?channelRelayURL(feed):feed.url;
   if(isHls&&HlsClass?.isSupported()){
    hls=new HlsClass({manifestLoadingTimeOut:15000,fragLoadingTimeOut:20000,manifestLoadingMaxRetry:0,levelLoadingMaxRetry:1,fragLoadingMaxRetry:1});
    hls.on(HlsClass.Events.MANIFEST_PARSED,start);
    hls.on(HlsClass.Events.ERROR,(_,data)=>{if(!current(epoch)||!data.fatal)return;if(data.type===HlsClass.ErrorTypes.MEDIA_ERROR&&!recoveredMedia){recoveredMedia=true;hls.recoverMediaError();return;}fallback(data,epoch);});
    hls.loadSource(url);hls.attachMedia(video);
   }else{video.onerror=()=>fallback({type:'mediaError'},epoch);video.src=url;start();}
  }catch(error){if(current(epoch))status.textContent=error.message;}
 };
 const fallback=async(data,epoch)=>{
  if(!current(epoch)||fallbackBusy)return;
  fallbackBusy=true;lastFailure=playbackFailure(data);
  if(!proxied){proxied=true;status.textContent='Retrying the channel through the server relay…';await connect();return;}
  // A provider may allow the viewer's location while refusing the server's location.
  if(!feed._directTried&&!forceRelay(feed)){feed={...feed,_directTried:true};proxied=false;status.textContent='Trying the channel directly from your location…';await connect();return;}
  status.textContent='Checking other public feeds of this same channel…';
  if(!alternatives)alternatives=await alternateFeeds(channel,tried);
  if(!current(epoch))return;
  const next=alternatives.find(item=>!tried.has(item.url));
  if(next&&tried.size<3){feed=next;tried.add(feed.url);proxied=forceRelay(feed);if(!proxied)feed={...feed,_directTried:true};status.textContent='Trying another public feed of '+channel.name+'…';await connect();return;}
  hls?.destroy();hls=null;
  status.textContent=lastFailure+' No working public feed was found among the '+tried.size+' source'+(tried.size===1?'':'s')+' tried.';
  message(channels.length+' channels loaded. '+channel.name+' could not be played.',true);
  fallbackBusy=false;
 };
 // Track the first direct attempt to avoid repeating it after the relay fails.
 if(!proxied)feed={...feed,_directTried:true};
 await connect();
}
async function playlistCatalog() {
 if (!catalogPromise) catalogPromise = fetchWithTimeout('/playlist-sources.json').then(async response=>{
  if (!response.ok) throw Error('The source catalog could not be loaded.');
  const catalog = await response.json();
  if (!Array.isArray(catalog.sources)) throw Error('The source catalog could not be loaded.');
  return catalog;
 }).catch(error=>{catalogPromise=null;throw error;});
 return catalogPromise;
}
function setupSourcePicker() {
 const tools=document.createElement('div');tools.className='playlist-source-tools';
 tools.innerHTML='<label for="playlist-source-search">Find a channel playlist</label><input id="playlist-source-search" type="search" placeholder="Search countries, languages, categories or regions"><label for="builtin-playlist">IPTV-org playlists</label><select id="builtin-playlist"><option value="">Custom playlist</option><option value="https://iptv-org.github.io/iptv/index.category.m3u">All channels · by category</option><option value="https://iptv-org.github.io/iptv/index.m3u">All channels</option></select><button id="load-builtin-playlist" type="button">Load channels</button><p id="playlist-source-status" role="status"></p>';
 form.before(tools);
 const select=tools.querySelector('select'),search=tools.querySelector('input'),status=tools.querySelector('[role=status]');
 const useSelection=()=>{if(select.value){document.querySelector('#playlist-url').value=select.value;document.querySelector('#playlist-file').value='';}};
 select.addEventListener('change',useSelection);
 tools.querySelector('button').addEventListener('click',()=>{useSelection();if(select.value)loadPlaylist(select.value);else message('Choose an IPTV-org playlist or paste your own URL below.',true);});
 const labels={all:'All channels',country:'Countries',category:'Categories',language:'Languages',region:'Regions',subdivision:'States and provinces',city:'Cities'};
 playlistCatalog().then(catalog=>{
  const fill=()=>{
   const current=document.querySelector('#playlist-url').value,query=search.value.trim().toLowerCase();
   select.replaceChildren(new Option('Custom playlist',''));
   let count=0;
   for(const [kind,label] of Object.entries(labels)){
    const items=catalog.sources.filter(x=>x.kind===kind&&(!query||(x.name+' '+label+' '+(x.code||'')).toLowerCase().includes(query)));
    if(!items.length)continue;
    const group=document.createElement('optgroup');group.label=label;
    items.forEach(source=>group.append(new Option(source.name,source.url)));select.append(group);count+=items.length;
   }
   select.value=[...select.options].some(option=>option.value===current)?current:'';
   status.textContent=query?(count+' matching playlists'):'Channels supplied by IPTV-org.';
  };
  search.addEventListener('input',fill);fill();
 }).catch(()=>{status.textContent='The full source catalog is unavailable. You can still use All channels or paste a playlist URL.';});
 document.querySelector('#playlist-url').addEventListener('input',()=>{select.value='';});
}
if (form) {
 setupSourcePicker();
 document.querySelectorAll('input[name="player-type"]').forEach(input => input.addEventListener('change', () => {message(input.dataset.type === 'http' ? 'HTTP compatibility mode selected. Streams will load through the secure player.' : 'HTTPS mode selected. Streams connect directly with an automatic compatibility fallback.');}));
 form.removeAttribute('action'); form.addEventListener('submit',event=>{
  event.preventDefault();const url=document.querySelector('#playlist-url').value.trim(),file=document.querySelector('#playlist-file').files[0];
  if(!url&&!file){message('Please provide either a M3U Playlist URL or File.',true);return;}
  if(file&&!/\.m3u8?$/i.test(file.name)){message('Only M3U and M3U8 files are allowed.',true);return;}
  loadPlaylist(url,file);
 });
 const url=new URLSearchParams(location.search).get('playlist') || DEFAULT_PLAYLIST;
 document.querySelector('#playlist-url').value=url;loadPlaylist(url);
}
function directoryStatus(item, text) {let status=document.querySelector('#directory-status');if(!status){status=document.createElement('p');status.id='directory-status';status.setAttribute('role','status');item.parentElement.before(status);}status.textContent=text;safeScroll(status);}
async function openDirectory(item) {
 try {
  const catalog=await playlistCatalog();
  const kind=item.dataset.country?'country':item.dataset.category?'category':'language';
  const name=item.dataset.country||item.dataset.category||item.dataset.language||'';
  const aliases={'Afghan Persian':'prs','Iranian Persian':'pes','Parsi-Dari':'prd','Undefined':'und'};
  const match=catalog.sources.find(source=>source.kind===kind&&(source.name.toLowerCase()===name.toLowerCase()||(item.dataset.playlist&&source.url===item.dataset.playlist)||(kind==='language'&&source.code===aliases[name])));
  const url=match?.url;
  if(url)location.href='/iptv-player/?playlist='+encodeURIComponent(url);
  else directoryStatus(item,'No public playlist is available for '+item.textContent.trim()+'. Please choose another selection.');
 }catch{directoryStatus(item,'Unable to load the directory. Please try again.');}
}
document.querySelectorAll('.world-item,.category-item,.language-item').forEach(item=>{item.removeAttribute('aria-haspopup');item.addEventListener('click',()=>openDirectory(item));item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openDirectory(item);}});});
document.querySelectorAll('form[data-local-form]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();let status=form.querySelector('[role=status]');if(!status){status=document.createElement('p');status.setAttribute('role','status');form.append(status);}status.textContent='This recreated site is not connected to the original website’s contact or newsletter service. Your information has not been submitted.';}));
