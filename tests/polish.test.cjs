const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM,VirtualConsole}=require('/tmp/iptv-tests/node_modules/jsdom');
const oldCode=fs.readFileSync('.impeccable/polish-baseline/app.js','utf8');
const newCode=fs.readFileSync('dist/app.js','utf8');
const oldAppCSS=fs.readFileSync('.impeccable/polish-baseline/app.css','utf8');
const originalHashes=JSON.parse(fs.readFileSync('.impeccable/polish-baseline/css-hashes.json','utf8'));
const catalog=JSON.parse(fs.readFileSync('dist/playlist-sources.json','utf8'));
const text='#EXTM3U\n#EXTINF:-1 group-title="News",Station\nhttps://example.com/live.m3u8';
async function surface(route,polished){
 const html=fs.readFileSync('dist/'+route+'index.html','utf8');
 const virtualConsole=new VirtualConsole();
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://player.example/'+route,virtualConsole}),w=dom.window;
 const sheets=[...w.document.querySelectorAll('link[rel=stylesheet]')];
 for(const link of sheets){
  const href=link.getAttribute('href');if(!href?.startsWith('/'))continue;
  if(href==='/polish.css'&&!polished)continue;
  const p='dist'+href;if(!fs.existsSync(p))continue;
  const style=w.document.createElement('style');style.textContent=href==='/app.css'&&!polished?oldAppCSS:fs.readFileSync(p,'utf8');w.document.head.append(style);
 }
 w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.load=function(){};w.HTMLElement.prototype.scrollIntoView=function(){};
 w.fetch=async url=>({ok:true,json:async()=>url==='/playlist-sources.json'?catalog:{text,url:'https://example.com/list.m3u'}});
 w.eval((polished?newCode:oldCode)+'\nwindow.loadPlaylist=loadPlaylist;');
 if(route==='iptv-player/')await w.loadPlaylist('https://example.com/list.m3u');
 await new Promise(r=>setImmediate(r));return dom;
}
test('original CSS, colours and responsive font-size declarations are untouched',()=>{
 for(const [file,hash] of Object.entries(originalHashes)){
  const current=fs.readFileSync('dist/'+file);assert.equal(crypto.createHash('sha256').update(current).digest('hex'),hash,file);
 }
 const css=fs.readFileSync('dist/polish.css','utf8');
 assert(!/\bfont-size\s*:|(?:^|[;{])\s*font\s*:/.test(css),'polish must not set text sizes');
 assert(!/(?:^|[;{])\s*(?:color|background(?:-color)?|border-color|outline-color|opacity)\s*:/.test(css),'polish must preserve existing colour declarations');
});
test('computed text sizes and colours match the baseline across representative pages',async()=>{
 const selectors={
  '':['body','#headline-73-529','#headline-74-529','#_rich_text-75-529','#headline-9-529','#text_block-79-529'],
  'iptv-player/':['body','h1','#playlist-url','#playlist-file','label[for=playlist-url]','#m3u-form button','.playlist-source-tools label','#builtin-playlist','.playlist-source-tools button','#channel-search','#channel-count','.favorite-filter','.channel-play span','#current-channel','#stop-playback','#fullscreen-playback'],
  'countries/':['body','h1','.world-country'],
  'categories/':['body','h1','.category-name'],
  'languages/':['body','h1','.language-name']
 };
 for(const [route,items] of Object.entries(selectors)){
  const before=await surface(route,false),after=await surface(route,true);
  try{for(const selector of items){const a=before.window.document.querySelector(selector),b=after.window.document.querySelector(selector);assert(a&&b,route+selector);const oldStyle=before.window.getComputedStyle(a),newStyle=after.window.getComputedStyle(b);assert.equal(newStyle.fontSize,oldStyle.fontSize,route+selector+' font size');assert.equal(newStyle.color,oldStyle.color,route+selector+' foreground');assert.equal(newStyle.backgroundColor,oldStyle.backgroundColor,route+selector+' background');}}
  finally{before.window.close();after.window.close();}
 }
});
test('Heroicons and always-visible playlist sources retain the player controls',async()=>{
 const dom=await surface('iptv-player/',true),d=dom.window.document;
 try{
  assert(d.querySelector('#m3u-form button [data-heroicon=play]'));
  assert(d.querySelector('#fullscreen-playback [data-heroicon=arrows-pointing-out]'));
  assert(d.querySelector('.channel-favorite [data-heroicon=star]'));
  d.querySelector('.channel-favorite').click();assert(d.querySelector('.channel-favorite [data-heroicon=star-solid]'));
  assert.equal(d.querySelector('#watch-player').parentElement.id,'inner_content-3-536');
  assert(d.querySelector('section.playlist-setup [role=heading]'));
  assert(d.querySelector('section.playlist-setup #playlist-url'));
  for(const icon of d.querySelectorAll('.hero-icon'))assert.equal(icon.getAttribute('aria-hidden'),'true');
 }finally{dom.window.close();}
 const html=fs.readFileSync('dist/categories/index.html','utf8');assert(!html.includes('<i class="fa-'));assert(html.includes('data-heroicon="film"'));
});
