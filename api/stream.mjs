import { pipeline } from 'node:stream/promises';
import { openUpstream, readLimited, rewriteManifest, sendError, PublicError } from '../lib/upstream.mjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.statusCode = 405; res.setHeader('Allow', 'GET'); res.end(); return; }
  let upstream;
  try {
    const params = new URL(req.url, 'https://player.local').searchParams;
    const source = params.get('url');
    const options = { userAgent: params.get('ua') || undefined, referer: params.get('referrer') || undefined };
    const opened = await openUpstream(source, { range: req.headers.range, ...options });
    upstream = opened.upstream;
    const type = (upstream.headers['content-type'] || '').split(';')[0].toLowerCase();
    const manifest = /mpegurl/.test(type) || /\.m3u8?$/i.test(new URL(opened.url).pathname);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (manifest) {
      const text = (await readLimited(upstream, 2 * 1024 * 1024)).toString('utf8');
      if (!/^#EXTM3U/m.test(text)) throw new PublicError(/^\s*</.test(text) ? 'The provider returned a webpage instead of a video playlist.' : 'The source did not return a playable HLS stream.', 422, 'source_invalid_media');
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.end(rewriteManifest(text, opened.url, options));
    } else {
      if (!/^(?:video\/|audio\/|application\/(?:octet-stream|mp4|vnd\.apple|binary)|binary\/)/.test(type) &&
          !/\.(?:ts|m4s|mp4|aac|mp3|key|vtt|webvtt)$/i.test(new URL(opened.url).pathname)) {
        upstream.destroy(); throw new PublicError('The source did not return supported video or audio.', 422);
      }
      res.statusCode = upstream.statusCode;
      // Never serve upstream HTML/SVG/scripts under the player's own origin.
      const mediaType = /^(?:video\/|audio\/|application\/(?:octet-stream|mp4|binary))/.test(type) ? type :
        /\.(?:vtt|webvtt)$/i.test(new URL(opened.url).pathname) ? 'text/vtt' : 'application/octet-stream';
      res.setHeader('Content-Type', mediaType);
      for (const header of ['content-range', 'accept-ranges']) if (upstream.headers[header]) res.setHeader(header, upstream.headers[header]);
      res.on('close', () => upstream.destroy());
      await pipeline(upstream, res);
    }
  } catch (error) { upstream?.destroy(); console.error('stream_load_failed', error.status || 502); sendError(res, error); }
}
