const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
let JSDOM;try{({JSDOM}=require('jsdom'));}catch{({JSDOM}=require('/tmp/iptv-tests/node_modules/jsdom'));}
const code=fs.readFileSync('dist/brand.js','utf8');
function mount(markup,url){
 const dom=new JSDOM('<body>'+markup+'<script id="plasma-config" type="application/json">{}</script></body>',{url:'https://example.test'+url,runScripts:'outside-only'});
 dom.window.eval(code);return dom;
}
test('homepage, directory, exchange, status and legal use the same public navigation',()=>{
 const routes=[['/','<header id="_header-2-15"></header>'],['/countries/','<header id="_header-2-15"></header>'],['/exchange/','<div id="plasmax-exchange-page"></div>'],['/status/abc','<main id="plasmax-exchange-status"></main>'],['/exchange/privacy-policy','<main id="plasmax-exchange-legal"></main>']];
 for(const [url,markup] of routes){const dom=mount(markup,url);try{
  const d=dom.window.document,header=d.querySelector('#plasma-public-header');
  assert.ok(header,url);assert.equal(d.querySelectorAll('#plasma-public-header').length,1);assert.equal(d.querySelector('#_header-2-15'),null);
  assert.deepEqual([...header.querySelectorAll('nav a')].map(a=>a.getAttribute('href')),['/exchange/','/','/countries/','/categories/','/languages/','https://x.com/plasma1337x','https://www.twitch.tv/plasma1337x']);
  assert.equal(header.querySelector('.plasma-public-watch').getAttribute('href'),'/iptv-player/');
  const open=header.querySelector('.plasma-public-menu-open'),close=header.querySelector('.plasma-public-menu-close'),menu=header.querySelector('ul');
  open.click();assert.equal(open.getAttribute('aria-expanded'),'true');assert.ok(menu.classList.contains('is-open'));
  close.click();assert.equal(open.getAttribute('aria-expanded'),'false');assert.ok(!menu.classList.contains('is-open'));
  open.click();header.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(open.getAttribute('aria-expanded'),'false');
  dom.window.eval(code);assert.equal(d.querySelectorAll('#plasma-public-header').length,1);
 }finally{dom.window.close();}}
});
test('admin is not given the public navigation',()=>{const dom=mount('<main id="plasmax-admin"></main>','/admin/dashboard');try{assert.equal(dom.window.document.querySelector('#plasma-public-header'),null);}finally{dom.window.close();}});
test('shared styles ship with static hosting and suppress the old exchange header',()=>{assert.match(fs.readFileSync('dist/brand.css','utf8'),/public-navigation\.css/);assert.match(fs.readFileSync('dist/exchange-sections.css','utf8'),/\.plasmax-site-header\{display:none!important\}/);assert.match(fs.readFileSync('exchange/exchange-overrides.css','utf8'),/\.plasmax-site-header\{display:none!important\}/);});
