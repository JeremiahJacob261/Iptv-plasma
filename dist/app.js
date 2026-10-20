'use strict';
const store = {
 get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
 set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
};
function parsePlaylist(text, base = location.href) {
 text = text.replace(/^\uFEFF/, '');
 if (/^#EXTM3U/m.test(text) && /#EXT-X-(TARGETDURATION|STREAM-INF|MEDIA-SEQUENCE)/.test(text)) return [{ name: 'Live Stream', url: base, group: '', logo: '', type: 'hls' }];
 const channels = []; let info = {};
 for (const line of text.split(/\r?\n/).map(x => x.trim())) {
  if (line.startsWith('#EXTINF:')) {
   const attrs = Object.fromEntries([...line.matchAll(/([\w-]+)="([^"]*)"/g)].map(x => [x[1], x[2]]));
   let quoted = false, comma = -1;
   for (let i = 0; i < line.length; i++) { if (line[i] === '"') quoted = !quoted; if (line[i] === ',' && !quoted) { comma = i; break; } }
   info = { name: (comma < 0 ? '' : line.slice(comma + 1).trim()) || attrs['tvg-name'] || 'Channel', logo: attrs['tvg-logo'] || '', group: attrs['group-title'] || '' };
  } else if (line && !line.startsWith('#')) {
   if (/[<>]/.test(line) || (!info.name && !/^https?:\/\//i.test(line) && !/\.(?:m3u8?|mp4|mp3|aac|ts)(?:[?#]|$)/i.test(line))) continue;
   try { const url = new URL(line, base); if (/^https?:$/.test(url.protocol)) channels.push({ name: info.name || 'Channel '+(channels.length+1), group: info.group || '', logo: info.logo || '', url: url.href }); } catch {}
   info = {};
  }
 }
 return channels;
}
const form = document.querySelector('#m3u-form');
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
 if (showMessage && document.querySelector('#stream-status')) document.querySelector('#stream-status').textContent = 'Playback stopped.';
}
function renderPlayer() {
 let panel = document.querySelector('#watch-player');
 if (!panel) {
  panel = document.createElement('section'); panel.id = 'watch-player'; panel.setAttribute('aria-label','IPTV channel player');
  panel.innerHTML = '<aside class="channel-sidebar"><input id="channel-search" type="search" placeholder="Filter Channels" aria-label="Filter Channels"><label class="favorite-filter"><input id="favorites-only" type="checkbox"> Favorite Channels</label><select id="channel-group" aria-label="Channel group"><option value="">All Channels</option></select><p id="channel-count" role="status"></p><div id="channel-list"></div><button id="load-more-channels" type="button" hidden>Load more channels</button></aside><div class="video-pane"><video id="iptv-video" controls playsinline preload="none"></video><div class="video-caption"><span id="current-channel">Select a channel to watch</span><button id="stop-playback" type="button">Stop</button></div><p id="stream-status" role="status"></p></div>';
  document.querySelector('#player-status').after(panel);
  ['#channel-search','#favorites-only','#channel-group'].forEach(selector=>panel.querySelector(selector).addEventListener(selector==='#channel-search'?'input':'change',()=>{pageSize=100;renderChannels();}));
  panel.querySelector('#load-more-channels').addEventListener('click',()=>{pageSize+=100;renderChannels();});
  panel.querySelector('#stop-playback').addEventListener('click', () => stopPlayback());
 }
 const group = panel.querySelector('#channel-group'); group.replaceChildren(new Option('All Channels',''));
 [...new Set(channels.map(x=>x.group).filter(Boolean))].sort().forEach(x=>group.add(new Option(x,x)));
 panel.querySelector('#channel-search').value=''; panel.querySelector('#favorites-only').checked=false;
 panel.querySelector('#current-channel').textContent='Select a channel to watch'; panel.querySelector('#stream-status').textContent='';
 renderChannels(); safeScroll(panel);
}
function renderChannels() {
 const query = document.querySelector('#channel-search').value.toLowerCase(), group = document.querySelector('#channel-group').value, only = document.querySelector('#favorites-only').checked;
 const list = document.querySelector('#channel-list'); list.replaceChildren();
 const filtered = channels.filter(x => x.name.toLowerCase().includes(query) && (!group || x.group === group) && (!only || favorites.has(x.url)));
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
async function playChannel(channel) {
 stopPlayback(false); const attempt = playAttempt;
 active = channel.url; renderChannels();
 const video = document.querySelector('#iptv-video'), status = document.querySelector('#stream-status');
 document.querySelector('#current-channel').textContent = channel.name; status.textContent = 'Connecting…';
 const isHls = channel.type === 'hls' || !/\.(?:mp4|mp3|aac|webm|ogg|mov|ts)(?:[?#]|$)/i.test(channel.url);
 const forceRelay = channel.url.startsWith('http:') || document.querySelector('#player-http')?.checked;
 let proxied = forceRelay, recoveredMedia = false;
 const streamURL = () => proxied ? '/api/stream?url='+encodeURIComponent(channel.url) : channel.url;
 const failed = () => { if(attempt===playAttempt) status.textContent='This channel is offline, restricted, or unavailable from this region. Try another channel.'; };
 const start = () => {
  if(attempt!==playAttempt)return;
  video.play().catch(error=>{if(attempt!==playAttempt)return;if(error.name==='NotAllowedError')status.textContent='Press Play in the video controls to start watching.';else if(error.name!=='AbortError')fallback();});
 };
 let HlsClass;
 const connect = () => {
  if(attempt!==playAttempt)return;
  video.onerror=null; hls?.destroy();hls=null;video.pause();video.removeAttribute('src');video.load();
  if(isHls && HlsClass?.isSupported()) {
   hls=new HlsClass({manifestLoadingTimeOut:20000,fragLoadingTimeOut:25000});
   hls.on(HlsClass.Events.MANIFEST_PARSED,start);
   hls.on(HlsClass.Events.ERROR,(_,data)=>{
    if(attempt!==playAttempt||!data.fatal)return;
    if(data.type===HlsClass.ErrorTypes.MEDIA_ERROR&&!recoveredMedia){recoveredMedia=true;hls.recoverMediaError();return;}
    fallback();
   });
   hls.loadSource(streamURL());hls.attachMedia(video);
  } else {video.onerror=fallback;video.src=streamURL();start();}
 };
 const fallback = () => {
  if(attempt!==playAttempt)return;
  if(!proxied){proxied=true;status.textContent='Retrying through the player…';connect();}else failed();
 };
 video.onplaying=()=>{if(attempt===playAttempt)status.textContent='';};
 try {
  // Safari uses native HLS; other browsers wait for hls.js before connecting.
  if(isHls&&!video.canPlayType('application/vnd.apple.mpegurl')) HlsClass=await ensureHls();
  if(attempt===playAttempt)connect();
 } catch(error){if(attempt===playAttempt)status.textContent=error.message;}
}
if (form) {
 document.querySelectorAll('input[name="player-type"]').forEach(input => input.addEventListener('change', () => {message(input.dataset.type === 'http' ? 'HTTP compatibility mode selected. Streams will load through the secure player.' : 'HTTPS mode selected. Streams connect directly with an automatic compatibility fallback.');}));
 form.removeAttribute('action'); form.addEventListener('submit',event=>{
  event.preventDefault();const url=document.querySelector('#playlist-url').value.trim(),file=document.querySelector('#playlist-file').files[0];
  if(!url&&!file){message('Please provide either a M3U Playlist URL or File.',true);return;}
  if(file&&!/\.m3u8?$/i.test(file.name)){message('Only M3U and M3U8 files are allowed.',true);return;}
  loadPlaylist(url,file);
 });
 const url=new URLSearchParams(location.search).get('playlist');
 if(url){document.querySelector('#playlist-url').value=url;loadPlaylist(url);}
}
function directoryStatus(item, text) {let status=document.querySelector('#directory-status');if(!status){status=document.createElement('p');status.id='directory-status';status.setAttribute('role','status');item.parentElement.before(status);}status.textContent=text;safeScroll(status);}
const directoryData={};
async function directoryJSON(name) {if(!directoryData[name])directoryData[name]=fetchWithTimeout('/'+name+'.json').then(r=>{if(!r.ok)throw Error('Directory unavailable');return r.json();}).catch(error=>{delete directoryData[name];throw error;});return directoryData[name];}
async function openDirectory(item) {
 let url=item.dataset.playlist;
 if(item.dataset.country==='International')url='https://iptv-org.github.io/iptv/index.m3u';
 try {
  if(!url&&item.dataset.country){const match=(await directoryJSON('countries')).find(x=>x.name.toLowerCase()===item.dataset.country.toLowerCase());if(match)url='https://iptv-org.github.io/iptv/countries/'+match.code.toLowerCase()+'.m3u';}
  if(!url&&item.dataset.category){const match=(await directoryJSON('categories')).find(x=>x.name.toLowerCase()===item.dataset.category.toLowerCase());if(match)url='https://iptv-org.github.io/iptv/categories/'+match.id+'.m3u';}
  if(!url&&item.dataset.language){const aliases={'Afghan Persian':'prs','Iranian Persian':'pes','Parsi-Dari':'prd','Undefined':'und'};if(aliases[item.dataset.language])url='https://iptv-org.github.io/iptv/languages/'+aliases[item.dataset.language]+'.m3u';const match=(await directoryJSON('languages')).find(x=>x.name.toLowerCase()===item.dataset.language.toLowerCase());if(match)url='https://iptv-org.github.io/iptv/languages/'+match.code+'.m3u';}
  if(url)location.href='/iptv-player/?playlist='+encodeURIComponent(url);
  else directoryStatus(item,'No public playlist is available for '+item.textContent.trim()+'. Please choose another selection.');
 }catch{directoryStatus(item,'Unable to load the directory. Please try again.');}
}
document.querySelectorAll('.world-item,.category-item,.language-item').forEach(item=>{item.removeAttribute('aria-haspopup');item.addEventListener('click',()=>openDirectory(item));item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openDirectory(item);}});});
document.querySelectorAll('form[data-local-form]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();let status=form.querySelector('[role=status]');if(!status){status=document.createElement('p');status.setAttribute('role','status');form.append(status);}status.textContent='This recreated site is not connected to the original website’s contact or newsletter service. Your information has not been submitted.';}));
