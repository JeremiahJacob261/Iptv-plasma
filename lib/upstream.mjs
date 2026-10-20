import http from 'node:http';
import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export class PublicError extends Error {
  constructor(message, status = 400, code = 'source_error', upstreamStatus) { super(message); this.status = status; this.code = code; this.upstreamStatus = upstreamStatus; }
}

export function providerHTTPError(status) {
  if ([401,403].includes(status)) return new PublicError(`The provider refused this feed (HTTP ${status}). It may require authorization or an allowed location.`, status, 'source_access_denied', status);
  if (status === 451) return new PublicError('The provider reports a legal or location restriction (HTTP 451).',451,'source_restricted',status);
  if ([404,410].includes(status)) return new PublicError(`The provider removed this feed or its URL has expired (HTTP ${status}).`,status,'source_missing',status);
  if (status === 429) return new PublicError('The provider is limiting connections (HTTP 429). Try again later.',429,'source_rate_limited',status);
  return new PublicError(`The provider returned HTTP ${status}.`,502,'source_unavailable',status);
}

export function playbackHeaders({ userAgent, referer } = {}) {
  const headers = { 'User-Agent': 'FreeIPTVPlayer/1.1', Accept: '*/*', 'Accept-Encoding': 'identity' };
  if (userAgent) {
    if (userAgent.length > 512 || /[\r\n]/.test(userAgent)) throw new PublicError('Invalid playlist user agent.');
    headers['User-Agent'] = userAgent;
  }
  if (referer) headers.Referer = publicURL(referer).href;
  return headers;
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

export async function openUpstream(value, { range, redirects = 0, userAgent, referer } = {}) {
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
    const headers = playbackHeaders({ userAgent, referer });
    if (range && /^bytes=\d*-\d*$/.test(range)) headers.Range = range;
    // Pin the validated DNS result to this connection, including redirects.
    const request = client.get(url, {
      headers,
      lookup: (_hostname, options, callback) => options.all ? callback(null, addresses) : callback(null, addresses[0].address, addresses[0].family),
    }, resolve);
    request.setTimeout(20000, () => request.destroy(new Error('Source timed out.')));
    request.on('error', () => reject(new PublicError('The source connection failed or timed out.', 502, 'source_connection_failed')));
  });
  if ([301, 302, 303, 307, 308].includes(upstream.statusCode)) {
    const location = upstream.headers.location; upstream.destroy();
    if (!location) throw new PublicError('The source returned an invalid redirect.', 502);
    return openUpstream(new URL(location, url).href, { range, redirects: redirects + 1, userAgent, referer });
  }
  if (upstream.statusCode < 200 || upstream.statusCode >= 300) {
    const code = upstream.statusCode; upstream.destroy();
    throw providerHTTPError(code);
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
  res.end(JSON.stringify({ error: error instanceof PublicError ? error.message : 'The source could not be loaded. Please try another source.', code: error.code || 'source_error', ...(error.upstreamStatus ? { upstreamStatus: error.upstreamStatus } : {}) }));
}

export function relayURL(value, { userAgent, referer } = {}) {
  playbackHeaders({ userAgent, referer });
  return '/api/stream?url=' + encodeURIComponent(publicURL(value).href) + (userAgent ? '&ua='+encodeURIComponent(userAgent) : '') + (referer ? '&referrer='+encodeURIComponent(referer) : '');
}

export function rewriteManifest(text, base, options = {}) {
  const resolve = value => relayURL(new URL(value, base).href, options);
  return text.split(/\r?\n/).map(line => {
    if (!line.trim()) return line;
    if (!line.startsWith('#')) return resolve(line.trim());
    return line.replace(/URI="([^"]+)"/g, (_, value) => `URI="${resolve(value)}"`);
  }).join('\n');
}
