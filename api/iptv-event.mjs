import { increment, dayKey, channelPlayKey } from '../lib/plasmax-metrics.mjs';
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
  if (!['visit', 'play'].includes(body?.event)) return res.status(400).end();
  try {
    const key = body.event === 'play' && channelPlayKey(body.channel);
    await increment(key || dayKey(body.event));
    return res.status(204).end();
  } catch {
    return res.status(503).end();
  }
}
