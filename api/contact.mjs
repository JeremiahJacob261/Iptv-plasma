import { noStore, sameOrigin } from '../lib/plasmax-admin.mjs';

const MAX_BODY_BYTES = 12_000;
const RECIPIENT = 'plasma1337x@gmail.com';
const SENDER = 'PlasmaX <noreply@plasmax.io>';

const clean = (value, max) => typeof value === 'string'
  ? value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max)
  : '';
const escapeHtml = value => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

export default async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Request not allowed.' });

  let body;
  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) return res.status(413).json({ error: 'Message is too long.' });
    body = JSON.parse(raw);
  } catch {
    return res.status(400).json({ error: 'Invalid form submission.' });
  }

  const name = clean(body?.name, 120);
  const email = clean(body?.email, 254);
  const subject = clean(body?.subject, 180);
  const message = clean(body?.message, 6000);
  if (!name || !subject || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please check the form fields and try again.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Contact form is temporarily unavailable. Please email plasma1337x@gmail.com.' });

  try {
    const upstream = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: SENDER,
        to: [RECIPIENT],
        reply_to: email,
        subject: `PlasmaX contact: ${subject}`,
        text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
        html: `<h2>New PlasmaX contact form submission</h2><p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Subject:</strong> ${escapeHtml(subject)}</p><p><strong>Message:</strong><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`
      })
    });
    if (!upstream.ok) {
      console.error('Resend contact delivery failed:', upstream.status);
      return res.status(502).json({ error: 'We could not send your message right now. Please try again shortly.' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Resend contact delivery error:', error instanceof Error ? error.message : 'unknown error');
    return res.status(502).json({ error: 'We could not send your message right now. Please try again shortly.' });
  }
}
