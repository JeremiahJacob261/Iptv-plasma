'use strict';
const store = {
 get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
 set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
};
function parsePlaylist(text, base = location.href) {
 if (/^#EXTM3U/m.test(text) && /#EXT-X-(TARGETDURATION|STREAM-INF|MEDIA-SEQUENCE)/.test(text)) return [{ name: 'Live Stream', url: base, group: '', logo: '', type: 'hls' }];
 const channels = []; let info = {};
 for (const line of text.replace(/^\uFEFF/, '').split(/\r?\n/).map(x => x.trim())) {
  if (line.startsWith('#EXTINF:')) {
   const attrs = Object.fromEntries([...line.matchAll(/([\w-]+)="([^"]*)"/g)].map(x => [x[1], x[2]]));
   info = { name: line.slice(line.indexOf(',') + 1).trim() || attrs['tvg-name'] || 'Channel', logo: attrs['tvg-logo'] || '', group: attrs['group-title'] || '' };
  } else if (line && !line.startsWith('#')) {
   try { const url = new URL(line, base); if (/^https?:$/.test(url.protocol)) channels.push({ name: info.name || 'Channel '+(channels.length+1), group: info.group || '', logo: info.logo || '', url: url.href }); } catch {}
   info = {};
  }
 }
 return channels;
}
const form = document.querySelector('#m3u-form');
let channels = [], hls, active, favorites = new Set(store.get('iptv-favorites', []));
function message(text, error = false) {
 let el = document.querySelector('#player-status');
 if (!el && form) { el = document.createElement('p'); el.id = 'player-status'; el.setAttribute('role', 'status'); form.after(el); }
 if (el) { el.textContent = text; el.classList.toggle('error', error); }
}
async function loadPlaylist(url, file) {
 const button = form?.querySelector('[type=submit]');
 if (button) { button.disabled = true; button.textContent = 'Loading…'; }
 message('Loading playlist…');
 try {
  let text;
  if (file) text = await file.text();
  else { const parsed = new URL(url); if (!['http:', 'https:'].includes(parsed.protocol)) throw Error('Enter an HTTP or HTTPS playlist URL.'); const response = await fetch(parsed.href, { signal: AbortSignal.timeout(30000) }); if (!response.ok) throw Error('Playlist returned HTTP '+response.status+'.'); text = await response.text(); }
  channels = parsePlaylist(text, url || location.href);
  if (!channels.length) throw Error('No playable channels were found. Check the file or try another M3U playlist.');
  if (file && /#EXT-X-/.test(text)) throw Error('For an HLS stream, paste its original URL so video segments can be loaded.');
  store.set('iptv-playlist', channels); renderPlayer(); message(channels.length+' channels loaded. Select a channel to watch.');
 } catch (error) { message(error instanceof TypeError ? 'Unable to load this playlist. Check its URL and whether the provider permits browser access (CORS). You can also upload the M3U file.' : error.message, true); }
 finally { if (button) { button.disabled = false; button.textContent = 'Watch'; } }
}
function renderPlayer() {
 let panel = document.querySelector('#watch-player');
 if (!panel) {
  panel = document.createElement('section'); panel.id = 'watch-player'; panel.setAttribute('aria-label','IPTV channel player');
  panel.innerHTML = '<aside class="channel-sidebar"><input id="channel-search" type="search" placeholder="Filter Channels" aria-label="Filter Channels"><label class="favorite-filter"><input id="favorites-only" type="checkbox"> Favorite Channels</label><select id="channel-group" aria-label="Channel group"><option value="">All Channels</option></select><p id="channel-count" role="status"></p><div id="channel-list"></div></aside><div class="video-pane"><video id="iptv-video" controls playsinline preload="none"></video><div class="video-caption"><span id="current-channel">Select a channel to watch</span><button id="stop-playback" type="button">Stop</button></div><p id="stream-status" role="status"></p></div>';
  document.querySelector('#player-status').after(panel);
  panel.querySelector('#channel-search').addEventListener('input', renderChannels);
  panel.querySelector('#favorites-only').addEventListener('change', renderChannels);
  panel.querySelector('#channel-group').addEventListener('change', renderChannels);
  panel.querySelector('#stop-playback').addEventListener('click', () => { const video = panel.querySelector('video'); video.pause(); hls?.destroy(); hls = null; video.removeAttribute('src'); video.load(); document.querySelector('#stream-status').textContent = 'Playback stopped.'; });
  panel.querySelector('video').addEventListener('error', () => { document.querySelector('#stream-status').textContent = 'This stream could not be played. It may be offline, restricted, or unsupported by your browser. Try another channel.'; });
 }
 const group = panel.querySelector('#channel-group'); group.replaceChildren(new Option('All Channels',''));
 [...new Set(channels.map(x=>x.group).filter(Boolean))].sort().forEach(x=>group.add(new Option(x,x)));
 renderChannels(); panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
}
function renderChannels() {
 const query = document.querySelector('#channel-search').value.toLowerCase(), group = document.querySelector('#channel-group').value, only = document.querySelector('#favorites-only').checked;
 const list = document.querySelector('#channel-list'); list.replaceChildren();
 const filtered = channels.filter(x => x.name.toLowerCase().includes(query) && (!group || x.group === group) && (!only || favorites.has(x.url)));
 document.querySelector('#channel-count').textContent = filtered.length+' channels';
 if (!filtered.length) { const p = document.createElement('p'); p.textContent = 'No channels match your filters.'; list.append(p); }
 const fragment = document.createDocumentFragment();
 filtered.forEach(channel => {
  const row = document.createElement('div'); row.className = 'channel-row'; row.classList.toggle('active', active === channel.url);
  const play = document.createElement('button'); play.type = 'button'; play.className = 'channel-play';
  if (/^https?:\/\//i.test(channel.logo)) { const image = document.createElement('img'); image.src = channel.logo; image.alt = ''; image.loading = 'lazy'; image.addEventListener('error',()=>image.remove(),{once:true}); play.append(image); }
  const name = document.createElement('span'); name.textContent = channel.name; play.append(name); play.addEventListener('click',()=>playChannel(channel));
  const fav = document.createElement('button'); fav.type = 'button'; fav.className = 'channel-favorite'; fav.setAttribute('aria-label',(favorites.has(channel.url)?'Remove from':'Add to')+' favorites: '+channel.name); fav.setAttribute('aria-pressed',favorites.has(channel.url)); fav.innerHTML = '<svg width="19" height="19" viewBox="0 0 24 24" fill="'+(favorites.has(channel.url)?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.6l6.2-.9Z"/></svg>';
  fav.addEventListener('click',()=>{favorites.has(channel.url)?favorites.delete(channel.url):favorites.add(channel.url);store.set('iptv-favorites',[...favorites]);renderChannels();});
  row.append(play,fav);fragment.append(row);
 }); list.append(fragment);
}
async function playChannel(channel) {
 active = channel.url; renderChannels(); const video = document.querySelector('#iptv-video'), status = document.querySelector('#stream-status');
 hls?.destroy(); hls = null; video.pause(); video.removeAttribute('src'); video.load();
 document.querySelector('#current-channel').textContent = channel.name;
 if (location.protocol === 'https:' && channel.url.startsWith('http:')) { status.textContent = 'This HTTP stream may be blocked on a secure page. Use an HTTPS stream supplied by your provider.'; } else status.textContent = 'Connecting…';
 const start = () => video.play().catch(()=>{status.textContent='Press Play in the video controls to start watching.';});
 if ((channel.type === 'hls' || /\.m3u8(?:[?#]|$)/i.test(channel.url)) && !video.canPlayType('application/vnd.apple.mpegurl') && window.Hls?.isSupported()) {
  hls = new Hls();hls.loadSource(channel.url);hls.attachMedia(video);hls.on(Hls.Events.MANIFEST_PARSED,start);hls.on(Hls.Events.ERROR,(_,data)=>{if(data.fatal)status.textContent='This stream is unavailable or blocks browser playback. Try another channel.';});
 } else { video.src = channel.url; start(); }
 video.onplaying = () => {status.textContent = '';};
}
if (form) {
 document.querySelectorAll('input[name="player-type"]').forEach(input => input.addEventListener('change', () => { message(input.dataset.type === 'http' ? 'HTTP mode selected. Your browser may block HTTP streams on this secure site; an HTTPS stream is recommended.' : 'HTTPS mode selected. Paste a playlist URL or upload your M3U file.'); }));
 form.removeAttribute('action'); form.addEventListener('submit',event=>{event.preventDefault();const url = document.querySelector('#playlist-url').value.trim(),file=document.querySelector('#playlist-file').files[0];if(!url&&!file){message('Please provide either a M3U Playlist URL or File.',true);return;}if(file&&!/\.m3u8?$/i.test(file.name)){message('Only M3U and M3U8 files are allowed.',true);return;}loadPlaylist(url,file);});
 const hlsScript = document.createElement('script');hlsScript.src='/hls.min.js';document.head.append(hlsScript);
 const url = new URLSearchParams(location.search).get('playlist');if(url){document.querySelector('#playlist-url').value=url;loadPlaylist(url);}
}
function directoryStatus(item, text) { let status = document.querySelector('#directory-status'); if (!status) { status = document.createElement('p'); status.id = 'directory-status'; status.setAttribute('role', 'status'); item.parentElement.before(status); } status.textContent = text; status.scrollIntoView({block:'nearest'}); }
async function openDirectory(item) {
 let url = item.dataset.playlist;
 if (item.dataset.country === 'International') url = 'https://iptv-org.github.io/iptv/index.m3u';
 try {
  if (!url && item.dataset.country) {const countries=await fetch('/countries.json').then(r=>r.json());const match=countries.find(x=>x.name.toLowerCase()===item.dataset.country.toLowerCase());if(match)url='https://iptv-org.github.io/iptv/countries/'+match.code.toLowerCase()+'.m3u';}
  if (!url && item.dataset.category) {const categories=await fetch('/categories.json').then(r=>r.json());const match=categories.find(x=>x.name.toLowerCase()===item.dataset.category.toLowerCase());if(match)url='https://iptv-org.github.io/iptv/categories/'+match.id+'.m3u';}
  if (!url && item.dataset.language) {const languages=await fetch('/languages.json').then(r=>r.json());const match=languages.find(x=>x.name.toLowerCase()===item.dataset.language.toLowerCase());if(match)url='https://iptv-org.github.io/iptv/languages/'+match.code+'.m3u';}
  if (url) location.href='/iptv-player/?playlist='+encodeURIComponent(url);
  else {directoryStatus(item, 'No public playlist is available for '+item.textContent.trim()+'. Please choose another selection.');}
 } catch {directoryStatus(item, 'Unable to load the directory. Please try again.');}
}
document.querySelectorAll('.world-item, .category-item, .language-item').forEach(item=>{item.removeAttribute('aria-haspopup');item.addEventListener('click',()=>openDirectory(item));item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openDirectory(item);}});});
document.querySelectorAll('form[data-local-form]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();let status=form.querySelector('[role=status]');if(!status){status=document.createElement('p');status.setAttribute('role','status');form.append(status);}status.textContent='This recreated site is not connected to the original website’s contact or newsletter service. Your information has not been submitted.';}));
