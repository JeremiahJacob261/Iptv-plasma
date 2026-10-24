import {readFile,writeFile,readdir} from 'node:fs/promises';
// A colour-only layer: keep the mirrored CSS, media queries and layout declarations intact.
const palette={'#00ff24':'#693695','#e74c3c':'#693695','#171422':'#191120','#202020':'#211929','#ffb700':'#cfb0ed','#66ff6a':'#7c4aa5','#009b1a':'#4c236f'};
function tint(value,property){let text=value.replace(/#(?:[a-f\d]{8}|[a-f\d]{6}|[a-f\d]{3})\b/gi,hex=>{
 const key=hex.toLowerCase();if(key==='#00ff24'&&/^(?:color|stroke|fill)$/.test(property))return '#cfb0ed';return palette[key]||hex;
 });
 text=text.replace(/rgba?\(\s*0\s*,\s*255\s*,\s*36(\s*,[^)]*)?\)/gi,(_,alpha)=>alpha?'rgba(105,54,149'+alpha+')':'rgb(105,54,149)');
 text=text.replace(/rgba?\(\s*23\s*,\s*20\s*,\s*34(\s*,[^)]*)?\)/gi,(_,alpha)=>alpha?'rgba(25,17,32'+alpha+')':'rgb(25,17,32)');return text;
}
function declarations(body){return body.split(';').flatMap(line=>{const match=line.match(/^\s*([\w-]+)\s*:([\s\S]*)$/);if(!match)return [];const [,property,value]=match;const next=tint(value,property);return value===next?[]:[property+':'+next];}).join(';');}
export function recolor(css){
 css=css.replace(/\/\*[\s\S]*?\*\//g,'');let out='',start=0;
 while(start<css.length){const open=css.indexOf('{',start);if(open<0)break;let depth=1,end=open+1,quote='';for(;end<css.length&&depth;end++){const c=css[end];if(quote){if(c===quote&&css[end-1]!=='\\')quote='';continue;}if(c==='"'||c==="'"){quote=c;continue;}if(c==='{')depth++;else if(c==='}')depth--;}
 const selector=css.slice(start,open).trim(),body=css.slice(open+1,end-1);start=end;
 if(selector.startsWith('@font-face')||selector.startsWith('@keyframes')||selector.startsWith('@-webkit-keyframes'))continue;
 const changed=body.includes('{')?recolor(body):declarations(body);if(changed)out+=selector+'{'+changed+'}\n';
 }return out;
}
const files=[];async function collect(dir){for(const e of await readdir(dir,{withFileTypes:true})){const path=dir+'/'+e.name;if(e.isDirectory())await collect(path);else files.push(path);}}await collect('dist');
let layer=':root{--plasma-primary:#693695;--plasma-link:#cfb0ed;--plasma-canvas:#191120;--plasma-player:#211929}\n';
for(const file of files.filter(x=>x.endsWith('.css')&&!x.endsWith('/theme.css')))layer+=recolor(await readFile(file,'utf8'));
layer+=`
.plasma-platforms a,.ct-link-button,.oxy-nav-menu-list .ct-link-button{background-color:var(--plasma-primary);color:#fff}
.ct-link-button{color:#fff!important}
.oxel_icon_button__container,.oxel_icon_button__container *{color:#fff!important}
.oxy-site-navigation{--oxynav-brand-color:#cfb0ed!important}
.oxy-site-navigation a{color:#cfb0ed!important}
#section-68-529,#section-68-529 .ct-headline,#section-68-529 .ct-text-block,#section-68-529 .ct-text-block *{color:#fff!important}
.plasma-platforms a:hover,.ct-link-button:hover{background-color:#55277e;color:#fff}
.oxy-site-navigation a,.oxy-nav-menu a{color:var(--plasma-link)}
.category-item:hover,.world-item:hover,.language-item:hover{background-color:var(--plasma-primary);color:#fff}
.category-item:hover .category-icon svg{stroke:#fff}
.channel-row.active{background-color:#382445}
.channel-favorite{color:var(--plasma-link)!important}
#watch-player :focus-visible,.social-viewer :focus-visible{outline-color:var(--plasma-link)}
.plasma-platforms a:focus-visible{outline:2px solid #fff;outline-offset:3px}
::selection{background:var(--plasma-primary);color:#fff}
.plasma-watermark{background:var(--plasma-canvas);color:#fff}
`;
await writeFile('dist/theme.css',layer);
for(const file of files.filter(x=>x.endsWith('.html'))){let html=await readFile(file,'utf8');if(!html.includes('<html'))continue;
 html=html.replace(/<link[^>]*href="\/theme.css"[^>]*>/g,'').replace(/<style id="plasma-theme-inline">[\s\S]*?<\/style>/g,'');let inline='';for(const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g))inline+=recolor(m[1]);
 html=html.replace(/style="([^"]*)"/g,(_,body)=>'style="'+body.split(';').map(d=>{const i=d.indexOf(':');return i<0?d:d.slice(0,i+1)+tint(d.slice(i+1),d.slice(0,i).trim());}).join(';')+'"');
 html=html.replace('</head>','<link rel="stylesheet" href="/theme.css">'+(inline?'<style id="plasma-theme-inline">'+inline+'</style>':'')+'</head>');await writeFile(file,html);
}
console.log('Applied logo-derived purple palette without layout or typography declarations.');
