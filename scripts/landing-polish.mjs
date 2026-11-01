import {readFile,writeFile} from 'node:fs/promises';
const path='dist/index.html';let html=await readFile(path,'utf8');
// Reorder the existing elements only; all original copy and destinations remain available.
function take(tag,pattern){const match=pattern.exec(html);if(!match)throw Error('Missing landing element: '+pattern);const start=match.index,open=html.indexOf('>',start)+1;let depth=1,end=open;const tags=new RegExp('<\\/?'+tag+'\\b[^>]*>','g');tags.lastIndex=open;let m;while(depth&&(m=tags.exec(html))){depth+=m[0].startsWith('</')?-1:1;end=tags.lastIndex;}if(depth)throw Error('Unclosed '+tag);const result=html.slice(start,end);html=html.slice(0,start)+html.slice(end);return result;}
if(!html.includes('class="plasma-landing-about"')){
 const nav=take('nav',/<nav class="plasma-platforms"/);
 const details=take('div',/<div\b[^>]*id="_rich_text-75-529"[^>]*>/);
 const action=take('div',/<div\b[^>]*id="div_block-76-529"[^>]*>/);
 const heading=/<h2\b[^>]*id="headline-74-529"[^>]*>[\s\S]*?<\/h2>/;
 if(!heading.test(html))throw Error('Missing landing introduction');
 html=html.replace(heading,m=>m+action+nav+'<details class="plasma-landing-about"><summary>About the player</summary>'+details+'</details>');
}
if(!html.includes('href="/landing.css"'))html=html.replace('</head>','<link rel="stylesheet" href="/landing.css"></head>');
await writeFile(path,html);console.log('Organized PlasmaX landing page.');
