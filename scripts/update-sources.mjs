import { writeFile } from 'node:fs/promises';
const documentation='https://raw.githubusercontent.com/iptv-org/iptv/master/PLAYLISTS.md';
const response=await fetch(documentation);
if(!response.ok)throw Error('IPTV-org playlist documentation returned HTTP '+response.status);
const text=await response.text();
const sources=new Map();
const aggregates=[
 ['All channels · by category','index.category.m3u'],
 ['All channels','index.m3u'],
 ['All channels · by country','index.country.m3u'],
 ['All channels · by language','index.language.m3u']
];
for(const [name,path] of aggregates){const url='https://iptv-org.github.io/iptv/'+path;sources.set(url,{name,url,kind:'all'});}
const kinds={categories:'category',languages:'language',countries:'country',regions:'region',subdivisions:'subdivision',cities:'city'};
const clean=value=>value.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/^[^\p{L}\p{N}]+/u,'').trim();
const add=(name,url,count)=>{
 const parsed=new URL(url);const [folder,file]=parsed.pathname.replace('/iptv/','').split('/');
 if(parsed.origin!=='https://iptv-org.github.io'||!kinds[folder]||!file?.endsWith('.m3u')||count===0)return;
 sources.set(url,{name:clean(name),url,kind:kinds[folder],code:file.slice(0,-4),...(count===undefined?{}:{listedChannels:count})});
};
for(const row of text.matchAll(/<tr><td[^>]*>(.*?)<\/td><td[^>]*>(\d+)<\/td><td[^>]*><code>(https:\/\/iptv-org\.github\.io\/iptv\/[^<]+)<\/code>/g))add(row[1],row[3],Number(row[2]));
for(const row of text.matchAll(/^\s*- (.*?) <code>(https:\/\/iptv-org\.github\.io\/iptv\/[^<]+)<\/code>/gm))add(row[1],row[2]);
if(sources.size<200 || Object.values(kinds).some(kind=>![...sources.values()].some(source=>source.kind===kind)))throw Error('IPTV-org documentation format changed; keeping existing catalog.');
const catalog={provider:'IPTV-org',repository:'https://github.com/iptv-org/iptv',documentation:'https://github.com/iptv-org/iptv/blob/master/PLAYLISTS.md',updatedAt:new Date().toISOString(),defaultURL:'https://iptv-org.github.io/iptv/index.category.m3u',sources:[...sources.values()]};
await writeFile('dist/playlist-sources.json',JSON.stringify(catalog));
console.log('Official playlist catalog:',sources.size,'sources');
console.log(Object.fromEntries([...new Set(catalog.sources.map(x=>x.kind))].map(kind=>[kind,catalog.sources.filter(x=>x.kind===kind).length])));
