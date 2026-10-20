import { openUpstream, readLimited, sendError, PublicError } from '../lib/upstream.mjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.statusCode = 405; res.setHeader('Allow', 'GET'); res.end(); return; }
  try {
    const source = new URL(req.url, 'https://player.local').searchParams.get('url');
    const { upstream, url } = await openUpstream(source);
    const text = (await readLimited(upstream, 4 * 1024 * 1024)).toString('utf8').replace(/^\uFEFF/, '');
    if (!/^#EXTM3U\b/m.test(text) && !/^https?:\/\/\S+$/m.test(text)) {
      throw new PublicError('The source did not return an M3U playlist. Check its URL.', 422);
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', /^https:\/\/iptv-org\.github\.io\/iptv\//.test(url) ? 'public, s-maxage=300, stale-while-revalidate=600' : 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(JSON.stringify({ text, url }));
  } catch (error) { console.error('playlist_load_failed', error.status || 502); sendError(res, error); }
}
