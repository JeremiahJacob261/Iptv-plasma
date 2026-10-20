import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { publicURL, isPublicIP, rewriteManifest, readLimited, providerHTTPError, playbackHeaders } from '../lib/upstream.mjs';
test('public URL validation blocks local, numeric, mapped IPv6 and unsupported sources',()=>{
 for(const url of ['http://127.0.0.1/','http://2130706433/','http://0x7f000001/','http://169.254.169.254/','http://10.0.0.1/','http://172.16.0.1/','http://192.168.1.1/','http://[::1]/','http://[::ffff:127.0.0.1]/','http://localhost/','http://x.internal/','file:///etc/passwd','ftp://example.com/','https://user:pass@example.com/'])assert.throws(()=>publicURL(url),url);
 assert.equal(publicURL('https://iptv-org.github.io/iptv/countries/ng.m3u').hostname,'iptv-org.github.io');
 assert.equal(isPublicIP('8.8.8.8'),true);assert.equal(isPublicIP('2606:4700:4700::1111'),true);
 for(const ip of ['0.0.0.0','100.64.0.1','169.254.2.2','224.0.0.1','fd00::1','fe80::1','::ffff:10.0.0.1'])assert.equal(isPublicIP(ip),false,ip);
});
test('HLS relay rewrites variants, segments, encryption keys and maps relative to final upstream URL',()=>{
 const input='#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="key.bin?token=abc"\n#EXT-X-MAP:URI="init.mp4"\n#EXT-X-MEDIA:TYPE=AUDIO,URI="audio/index.m3u8"\n#EXT-X-STREAM-INF:BANDWIDTH=123\n../video/index.m3u8?token=abc\n#EXTINF:6,\npart.ts';
 const output=rewriteManifest(input,'https://cdn.example.com/path/live.m3u8');
 assert(output.includes('/api/stream?url='+encodeURIComponent('https://cdn.example.com/path/key.bin?token=abc')));
 assert(output.includes('/api/stream?url='+encodeURIComponent('https://cdn.example.com/path/init.mp4')));
 assert(output.includes('/api/stream?url='+encodeURIComponent('https://cdn.example.com/path/audio/index.m3u8')));
 assert(output.includes('/api/stream?url='+encodeURIComponent('https://cdn.example.com/video/index.m3u8?token=abc')));
 assert(output.includes('/api/stream?url='+encodeURIComponent('https://cdn.example.com/path/part.ts')));
 assert.throws(()=>rewriteManifest('#EXTM3U\nhttp://127.0.0.1/secret','https://example.com/'));
});
test('bounded readers reject oversized playlists',async()=>{
 assert.equal((await readLimited(Readable.from([Buffer.from('hello')]),10)).toString(),'hello');
 await assert.rejects(readLimited(Readable.from([Buffer.alloc(11)]),10),/too large/);
});

test('provider denials are distinguished from missing feeds and connection problems',()=>{
 assert.equal(providerHTTPError(403).code,'source_access_denied');assert.equal(providerHTTPError(403).status,403);assert.equal(providerHTTPError(403).upstreamStatus,403);
 assert.equal(providerHTTPError(404).code,'source_missing');assert.equal(providerHTTPError(451).code,'source_restricted');assert.equal(providerHTTPError(429).code,'source_rate_limited');
 assert(!providerHTTPError(404).message.includes('region'));
});
test('only playlist-declared safe request headers propagate through HLS child URLs',()=>{
 const headers=playbackHeaders({userAgent:'Example Player',referer:'https://provider.example.com/player'});assert.equal(headers['User-Agent'],'Example Player');assert.equal(headers.Referer,'https://provider.example.com/player');
 assert.throws(()=>playbackHeaders({userAgent:'Player\r\nAuthorization: bad'}));assert.throws(()=>playbackHeaders({referer:'http://127.0.0.1/'}));
 const text=rewriteManifest('#EXTM3U\nvariant.m3u8','https://cdn.example.com/live/',{userAgent:'Example Player',referer:'https://provider.example.com/player'});assert(text.includes('&ua=Example%20Player'));assert(text.includes('&referrer=https%3A%2F%2Fprovider.example.com%2Fplayer'));
});
