import {readFile,writeFile,readdir} from 'node:fs/promises';
const iconPath=process.argv[2]||'icons/heroicons.json';
const icons=JSON.parse(await readFile(iconPath,'utf8'));
const symbolIcons={check:'check',close:'x-mark',play:'play',group:'users',bars:'bars-3',enter:'arrow-right-on-rectangle','chevron-down':'chevron-down'};
const categoryIcons={Animation:'film',Auto:'truck',Business:'briefcase',Classic:'clock',Comedy:'face-smile',Cooking:'fire',Culture:'globe-alt',Documentary:'video-camera',Education:'academic-cap',Entertainment:'tv',Family:'home',General:'rectangle-group',Interactive:'cursor-arrow-rays',Kids:'puzzle-piece',Legislative:'building-library',Lifestyle:'sparkles',Movies:'film',Music:'musical-note',News:'newspaper',Outdoor:'sun',Public:'building-office',Relax:'moon',Religious:'building-library',Science:'beaker',Series:'squares-2x2',Shop:'shopping-bag',Sports:'trophy',Travel:'paper-airplane',Weather:'cloud',Undefined:'question-mark-circle',XXX:'question-mark-circle'};
const faIcons={'fa-horse':'film','fa-car':'truck','fa-user-tie':'briefcase','fa-tv':'tv','fa-masks-theater':'face-smile','fa-fire':'fire','fa-globe':'globe-alt','fa-film':'film','fa-graduation-cap':'academic-cap','fa-house':'home','fa-child':'puzzle-piece','fa-music':'musical-note','fa-newspaper':'newspaper','fa-sun':'sun','fa-landmark':'building-library','fa-flask':'beaker','fa-bag-shopping':'shopping-bag','fa-trophy':'trophy','fa-plane':'paper-airplane','fa-cloud':'cloud','fa-question':'question-mark-circle','fa-chevron-down':'chevron-down','fa-bars':'bars-3','fa-play':'play','fa-check':'check'};
const svg=(name)=>icons[name].replace('<svg ',`<svg class="hero-icon" data-heroicon="${name}" width="24" height="24" focusable="false" `);
const inner=name=>icons[name].replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'').replace(/<path /g,'<path fill="none" stroke="currentColor" stroke-width="1.5" ');
async function visit(directory){
 let count=0;
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const path=directory+'/'+entry.name;
  if(entry.isDirectory()){count+=await visit(path);continue;}
  if(!entry.name.endsWith('.html'))continue;
  let text=await readFile(path,'utf8');
  if(!/<html\b/i.test(text))continue;
  text=text.replace(/<script\b[^>]*src="\/assets\/a449130d2dc4ca9f7839\.js"[^>]*>[\s\S]*?<\/script>/g,'');
  text=text.replace(/<symbol\b[^>]*id="((?:FontAwesome|Linearicons)icon-([^"]+))"[^>]*>[\s\S]*?<\/symbol>/g,(whole,id,key)=>{
   const name=symbolIcons[key];return name?`<symbol id="${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${inner(name)}</symbol>`:whole;
  });
  text=text.replace(/(<div\b[^>]*data-category="([^"]+)"[^>]*>[\s\S]*?<span class="category-icon">)[\s\S]*?(<\/span>)/g,(_all,prefix,name,suffix)=>prefix+svg(categoryIcons[name]||'question-mark-circle')+suffix);
  text=text.replace(/<i\b[^>]*class="([^"]*)"[^>]*>[\s\S]*?<\/i>/g,(whole,classes)=>{
   if(!/\bfa[- ]/.test(classes))return whole;
   const name=classes.split(/\s+/).map(value=>faIcons[value]).find(Boolean)||'question-mark-circle';return svg(name);
  });
  if(!text.includes('href="/polish.css"'))text=text.replace('</head>','<link rel="stylesheet" href="/polish.css"></head>');
  await writeFile(path,text);count++;
 }
 return count;
}
console.log('Polished shared layout and Heroicons in',await visit('dist'),'HTML pages.');
