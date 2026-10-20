import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
const entries=[['90001','X (Twitter)','/x/'],['90002','Twitch','/twitch/']].map(([ID,title,url])=>({ID,menu_item_parent:'0',title,url,classes:['menu-item'],target:'',description:'',menu_image:''}));
const menu=JSON.stringify(entries).slice(1,-1).replaceAll('"',"'")+',';
async function visit(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())await visit(p);else if(e.name.endsWith('.html')){let s=await readFile(p,'utf8');if(!s.includes("'ID':'90001'")){s=s.replaceAll('menu = [','menu = ['+menu).replaceAll('menu: [','menu: ['+menu);await writeFile(p,s);}}}}
await visit('dist');
const template=await readFile('dist/iptv-player/index.html','utf8');
for(const platform of ['x','twitch']){
 const title=platform==='x'?'X (Twitter)':'Twitch';
 const prompt=platform==='x'?'Paste a public X post or profile link to view it here.':'Paste a Twitch channel or video link to watch here.';
 const form=`<section class="social-viewer" data-platform="${platform}"><p>${prompt}</p><form id="social-form" class="playlist-source-tools"><label for="social-url">${platform==='x'?'X post or profile URL':'Twitch channel or video URL'}</label><input id="social-url" type="text" inputmode="url" autocomplete="off" required placeholder="${platform==='x'?'https://x.com/username/status/…':'https://www.twitch.tv/channel'}"><button type="submit">${platform==='x'?'View':'Watch'}</button></form><p id="social-status" role="status" aria-live="polite">${platform==='x'?'Public posts and supported profile timelines appear below.':'Live channels and recorded videos play below.'}</p><div id="social-embed" aria-label="${title} viewer"></div><div class="social-actions"><button id="social-clear" type="button" hidden>Clear viewer</button><a id="social-original" hidden target="_blank" rel="noopener noreferrer">Open on ${title}</a></div><p>${platform==='x'?'X may limit profile timelines or require sign-in for some content. Protected, deleted, and unavailable posts cannot be displayed.':'No account is needed for most public streams. Offline channels, subscriber-only videos, age checks, and regional restrictions are controlled by Twitch. Twitch may display ads.'}</p></section>`;
 let html=template;const start=html.indexOf('<div class="ct-inner-content" id="inner_content-3-536">');if(start<0)throw Error('Missing content template');
 const openEnd=html.indexOf('>',start)+1;let depth=1,end=openEnd;const tags=/<\/?div\b[^>]*>/g;tags.lastIndex=openEnd;let tag;while(depth&&(tag=tags.exec(html))){depth+=tag[0].startsWith('</')?-1:1;end=tags.lastIndex;}if(depth)throw Error('Unclosed template');
 html=html.slice(0,openEnd)+form+html.slice(end-6);
 html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${title} Viewer - Free IPTV Player</title>`).replace(/(<h1\b[^>]*>)[\s\S]*?(<\/h1>)/,`$1${title}$2`).replace(/<meta\b[^>]*(?:property="(?:og:|article:)|name="(?:description|twitter:))[^>]*>/g,'');
 html=html.replace('</head>',`<meta name="description" content="${prompt}"><link rel="stylesheet" href="/social.css"></head>`).replace('</body>','<script defer src="/social.js"></script></body>');
 await mkdir('dist/'+platform,{recursive:true});await writeFile('dist/'+platform+'/index.html',html);
}
console.log('Installed X and Twitch viewers and shared navigation.');
