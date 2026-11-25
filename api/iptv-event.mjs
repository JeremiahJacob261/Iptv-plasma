import { increment, dayKey, channelPlayKey, recordViewer } from '../lib/plasmax-metrics.mjs';
import { sameOrigin } from '../lib/plasmax-admin.mjs';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  if (!sameOrigin(req)) return res.status(403).end();
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).end();
  }
  if (!['visit', 'play', 'watch'].includes(body?.event)) return res.status(400).end();
  try {
    const key = body.event !== 'visit' && channelPlayKey(body.channel);
    if (body.event === 'watch' && !key) return res.status(400).end();
    await increment(body.event === 'watch' ? key.replace('_channel_', '_watch_') : key || dayKey(body.event));
    if (body.event === 'play' && key) await recordViewer(key, body.viewer);
    return res.status(204).end();
  } catch {
    return res.status(503).end();
  }
}
