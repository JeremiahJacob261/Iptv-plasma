import { readdir, readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';
const parts=(await readdir('.')).filter(x=>/^source-\d+\.part$/.test(x)).sort();
await writeFile('/tmp/site-source.tgz',Buffer.concat(await Promise.all(parts.map(x=>readFile(x)))));
execFileSync('tar',['-xzf','/tmp/site-source.tgz']);
const queue=JSON.parse(await readFile('assets-download.json','utf8'));let done=0;
await Promise.all(Array.from({length:12},async()=>{
 while(queue.length){
  const asset=queue.shift();
  for(let retry=0;;retry++){
   try {
    const response=await fetch(asset.url,{signal:AbortSignal.timeout(45000)});
    if(!response.ok)throw Error('HTTP '+response.status);
    const buffer=Buffer.from(await response.arrayBuffer());
    if(createHash('sha256').update(buffer).digest('hex')!==asset.sha256)throw Error('Asset content changed');
    await mkdir(dirname(asset.path),{recursive:true});await writeFile(asset.path,buffer);done++;break;
   }catch(error){if(retry>=3)throw Error(asset.url+': '+error.message);}
  }
  if(done%50===0)console.log('Restored '+done+' original assets');
 }
}));
await copyFile('updates/app.js','dist/app.js');
await copyFile('updates/app.css','dist/app.css');
await copyFile('updates/playlist-sources.json','dist/playlist-sources.json');
await copyFile('updates/polish.css','dist/polish.css');
await copyFile('updates/inter-latin.woff2','dist/assets/inter-latin.woff2');
await copyFile('updates/Heroicons-LICENSE.txt','dist/assets/Heroicons-LICENSE.txt');
await copyFile('updates/Inter-LICENSE.txt','dist/assets/Inter-LICENSE.txt');
await copyFile('data/featured-catalog.json','dist/featured-catalog.json');
await copyFile('updates/live-directory.js','dist/live-directory.js');
await copyFile('updates/x-player.js','dist/x-player.js');
await copyFile('updates/social.js','dist/social.js');
await copyFile('updates/social.css','dist/social.css');
execFileSync(process.execPath,['scripts/social-pages.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/polish-pages.mjs','updates/heroicons.json'],{stdio:'inherit'});
try { execFileSync(process.execPath,['scripts/update-sources.mjs'],{stdio:'inherit'}); } catch { console.log('Using verified IPTV-org catalog snapshot.'); }
for(const name of ['brand.css','brand.js'])await copyFile('updates/'+name,'dist/'+name);
for(const name of ['plasmax-mark.svg','plasmax-logo.svg','plasmax-player-preview.png'])await copyFile('updates/'+name,'dist/assets/'+name);
execFileSync(process.execPath,['scripts/brand-pages.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['scripts/theme-pages.mjs'],{stdio:'inherit'});
console.log('Static site ready: original assets verified and player updates installed.');
