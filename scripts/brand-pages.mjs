import {readFile,writeFile,readdir,copyFile} from 'node:fs/promises';
const config=JSON.parse(await readFile('data/site-config.json','utf8'));
if(config.brand!=='PlasmaX')throw Error('Unexpected brand configuration');
const serialized=JSON.stringify(config).replaceAll('<','\\u003c');
const links='<nav class="plasma-platforms" aria-label="Watch on PlasmaX"><a href="/iptv-player/">Live TV</a><a href="/x/">X (Twitter)</a><a href="/twitch/">Twitch</a></nav>';
let pages=0;
async function visit(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory()){await visit(p);continue;}if(!e.name.endsWith('.html'))continue;
 let s=await readFile(p,'utf8');if(!s.includes('<html'))continue;
 s=s.replace(/<meta\b[^>]*(?:name="twitter:site"|property="og:image[^\"]*"|name="msapplication-TileImage")[^>]*>/g,'');
 s=s.replace(/Free Online IPTV Web Player/gi,'PlasmaX').replace(/Free IPTV Player/gi,'PlasmaX').replace(/freeiptvplayer\.net/gi,'plasmax.io').replace(/@freeiptvplayer/gi,'PlasmaX');
 s=s.replace(/<title>([\s\S]*?)<\/title>/,(_,title)=>'<title>'+(title.includes('PlasmaX')?title:title+' - PlasmaX')+'</title>');
 s=s.replace(/(<meta\b[^>]*content=")([^"]*)("[^>]*property="og:title"[^>]*>)/g,(_,a,title,b)=>a+(title.includes('PlasmaX')?title:title+' - PlasmaX')+b);
 s=s.replace(/<img\b[^>]*src="\/assets\/2e47e105b704ea5001cc.webp"[^>]*>/g,t=>t.replace(/src="[^"]*"/,'src="/assets/plasmax-logo.svg"').replace(/alt="[^"]*"/,'alt="PlasmaX"'));
 s=s.replace(/(<link\b[^>]*href=")[^"]*("[^>]*rel="(?:icon|apple-touch-icon)"[^>]*>)/g,'$1/assets/plasmax-mark.svg$2');
 // Old promotional artwork contains the previous brand. Replace with a real PlasmaX player capture.
 s=s.replace(/\/assets\/(?:646c2998f1b521afb914|b5e6276489ee67769ee3)\.png/g,'/assets/plasmax-player-preview.png');
 s=s.replace(/<script id="plasma-config"[\s\S]*?<\/script>/g,'').replace(/<script defer src="\/brand.js"><\/script>/g,'');
 if(!s.includes('href="/brand.css"'))s=s.replace('</head>','<link rel="stylesheet" href="/brand.css"></head>');
 if(p==='dist/index.html')s=s.replace(/(<h1[^>]*>)[\s\S]*?(<\/h1>)/,'$1Watch live TV with PlasmaX$2');
 if(p==='dist/index.html'&&!s.includes('class="plasma-platforms"'))s=s.replace(/(<\/h1>)/, '$1'+links);
 if(/dist\/(?:iptv-player|x|twitch)\/index.html$/.test(p)&&!s.includes('class="plasma-ad"'))s=s.replace(/(<div class="ct-inner-content"[^>]*>)/,'$1<aside class="plasma-ad" aria-label="Advertisement" hidden><p>Advertisement</p></aside>');
 if((p==='dist/index.html'||/dist\/(?:iptv-player|x|twitch)\/index.html$/.test(p))&&!s.includes('src="/hilltop.js"'))s=s.replace('</body>','<script defer src="/hilltop.js"></script></body>');
 s=s.replace('</body>',`<script id="plasma-config" type="application/json">${serialized}</script><script defer src="/brand.js"></script></body>`);
 await writeFile(p,s);pages++;
}}
await visit('dist');
await writeFile('dist/site.webmanifest',JSON.stringify({name:'PlasmaX',short_name:'PlasmaX',start_url:'/',display:'browser',background_color:'#191120',theme_color:'#191120',icons:[{src:'/assets/plasmax-mark.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}]}));
const ads=config.advertising;if(ads?.enabled&&/^ca-pub-\d{16}$/.test(ads.publisherId))await writeFile('dist/ads.txt',`google.com, ${ads.publisherId.slice(3)}, DIRECT, f08c47fec0942fa0\n`);else await writeFile('dist/ads.txt',ads?.enabled?'# Ads.txt entries have not been provided.\n':'# PlasmaX: advertising is not activated.\n');
console.log('Applied PlasmaX identity to',pages,'pages; advertising',ads?.enabled?'configured':'disabled');
