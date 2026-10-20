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
console.log('Static site ready: original assets verified and player updates installed.');
