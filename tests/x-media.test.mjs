import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {parseXURL,mediaURL,resolveX,normalizePost,normalizeBroadcast,broadcastInitial} from '../lib/x-media.mjs';
const post=JSON.parse(fs.readFileSync('tests/fixtures/x-post.json')),broadcast=fs.readFileSync('tests/fixtures/x-broadcast.html','utf8');
test('X URL and media allowlists reject hostile URLs, auth, profiles and Spaces',()=>{
 for(const url of ['http://x.com/u/status/123','https://x.com.evil.com/u/status/123','http://127.0.0.1/','https://user:pass@x.com/u/status/123','https://x.com/u','https://x.com/i/spaces/abc'])assert.throws(()=>parseXURL(url));
 for(const url of ['https://video.twimg.com.evil.com/v.mp4','https://127.0.0.1/video.mp4','https://example.com/v.mp4','https://video.twimg.com/geoblocked/v.mp4'])assert.equal(mediaURL(url),'');
 assert.equal(parseXURL('https://x.com/u/status/123/video/2').index,1);assert.equal(parseXURL('https://x.com/i/web/status/123').id,'123');
});
test('public X broadcast JSON is decoded without executing scripts',async()=>{
 const result=await resolveX('https://x.com/i/broadcasts/1ZkKzeyrPbaxv',async url=>{assert.equal(url,'https://studio.x.com/embed/broadcast/1ZkKzeyrPbaxv');return broadcast;});
 assert.equal(result.author.username,'SpaceX');assert.equal(result.state,'replay');assert.equal(result.videos[0].sources[0].type,'hls');assert.match(result.videos[0].sources[0].url,/\.m3u8/);
 assert.throws(()=>broadcastInitial('<script>alert(1)</script>','whatever'),/public playback data/);
 assert.throws(()=>normalizeBroadcast({ok:false,kind:'not-found'},{url:'x'}),/not found/);
});
test('post video variants retain multiple clips and select the shared video index',async()=>{
 const result=await resolveX('https://x.com/CTVJLaidlaw/status/1600649710662213632/video/2',async url=>{assert(url.startsWith('https://cdn.syndication.twimg.com/tweet-result?'));return JSON.stringify(post);});
 assert.equal(result.videos.length,2);assert.equal(result.initialIndex,1);assert.equal(result.author.name,'Jocelyn Laidlaw');assert.equal(result.videos[0].sources[0].type,'mp4');assert(result.videos[0].sources.some(x=>x.type==='hls'));
 const result2=normalizePost({...post,mediaDetails:[{type:'video',video_info:{variants:[{url:'https://127.0.0.1/v.mp4',content_type:'video/mp4'}]}}]},{url:'x',index:0});assert.equal(result2.videos.length,0);
});
test('video-free posts stay text-only and public broadcast links resolve without recursion',async()=>{
 const basic={id_str:'123',text:'Post',user:{name:'Name',screen_name:'name'}};
 const result=await resolveX('https://x.com/u/status/123',async()=>JSON.stringify(basic));assert.equal(result.videos.length,0);
 let calls=0;const linked={...basic,entities:{urls:[{expanded_url:'https://x.com/i/broadcasts/1ZkKzeyrPbaxv'}]}};
 const result2=await resolveX('https://x.com/u/status/123',async()=>++calls===1?JSON.stringify(linked):broadcast);assert.equal(result2.state,'replay');assert.equal(calls,2);
});
