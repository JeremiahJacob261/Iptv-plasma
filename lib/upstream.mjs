import http from 'node:http';
import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export class PublicError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

export function isPublicIP(address) {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && [0, 168].includes(b)) ||
      (a === 198 && [18, 19].includes(b)));
  }
  // Only global-unicast IPv6; exclude mapped IPv4, loopback, link-local, ULA, multicast.
  return isIP(address) === 6 && /^[23][0-9a-f]{3}:/i.test(address) &&
    !/^2001:(?:0:|db8:)/i.test(address);
}

export function publicURL(value) {
  let url;
  try { url = new URL(value); } catch { throw new PublicError('Enter a valid HTTP or HTTPS URL.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      /(?:^|\.)(?:localhost|local|internal|home|test|invalid)$/i.test(url.hostname)) {
    throw new PublicError('Only public HTTP and HTTPS sources are supported.');
  }
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host) && !isPublicIP(host)) throw new PublicError('Private network sources are not supported.');
  if (url.href.length > 6000) throw new PublicError('The source URL is too long.');
  return url;
}

export async function openUpstream(value, { range, redirects = 0 } = {}) {
  const url = publicURL(value);
  if (redirects > 5) throw new PublicError('The source redirected too many times.', 502);
  const host = url.hostname.replace(/^\[|\]$/g, '');
  let addresses;
  try { addresses = isIP(host) ? [{ address: host, family: isIP(host) }] : await lookup(host, { all: true }); }
  catch { throw new PublicError('The source server could not be found.', 502); }
  if (!addresses.length || addresses.some(x => !isPublicIP(x.address))) {
    throw new PublicError('Private network sources are not supported.');
  }
  const upstream = await new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
    const headers = { 'User-Agent': 'FreeIPTVPlayer/1.1', Accept: '*/*', 'Accept-Encoding': 'identity' };
    if (range && /^bytes=\d*-\d*$/.test(range)) headers.Range = range;
    // Pin the validated DNS result to this connection, including redirects.
    const request = client.get(url, {
      headers,
      lookup: (_hostname, options, callback) => options.all ? callback(null, addresses) : callback(null, addresses[0].address, addresses[0].family),
    }, resolve);
    request.setTimeout(20000, () => request.destroy(new Error('Source timed out.')));
    request.on('error', () => reject(new PublicError('The source is unavailable or timed out. Try another channel.', 502)));
  });
  if ([301, 302, 303, 307, 308].includes(upstream.statusCode)) {
    const location = upstream.headers.location; upstream.destroy();
    if (!location) throw new PublicError('The source returned an invalid redirect.', 502);
    return openUpstream(new URL(location, url).href, { range, redirects: redirects + 1 });
  }
  if (upstream.statusCode < 200 || upstream.statusCode >= 300) {
    const code = upstream.statusCode; upstream.destroy();
    throw new PublicError(code === 404 ? 'This playlist or channel is no longer available (404).' : `The source returned HTTP ${code}. Try another source.`, code === 404 ? 404 : 502);
  }
  return { upstream, url: url.href };
}

export async function readLimited(stream, limit) {
  const chunks = []; let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > limit) { stream.destroy(); throw new PublicError('This playlist is too large. Try a smaller playlist.', 413); }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function sendError(res, error) {
  if (res.headersSent) { res.destroy(); return; }
  res.statusCode = error instanceof PublicError ? error.status : 502;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ error: error instanceof PublicError ? error.message : 'The source could not be loaded. Please try another source.' }));
}

export function relayURL(value) { return '/api/stream?url=' + encodeURIComponent(publicURL(value).href); }

export function rewriteManifest(text, base) {
  const resolve = value => relayURL(new URL(value, base).href);
  return text.split(/\r?\n/).map(line => {
    if (!line.trim()) return line;
    if (!line.startsWith('#')) return resolve(line.trim());
    return line.replace(/URI="([^"]+)"/g, (_, value) => `URI="${resolve(value)}"`);
  }).join('\n');
}
