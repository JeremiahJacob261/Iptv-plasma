import { randomUUID } from 'node:crypto';

const BLOG_KEY = 'plasmax_precious_metals_blog_v1';
function invalid(message) { const error = new Error(message); error.statusCode = 400; throw error; }

function config() {
  const base = process.env.PLASMAX_SUPABASE_URL;
  const key = process.env.PLASMAX_SUPABASE_SERVICE_KEY;
  if (!base || !key) throw new Error('Content storage is unavailable');
  return { base: base.replace(/\/$/, ''), key };
}

async function request(params, method = 'GET', body) {
  const { base, key } = config();
  const url = new URL(`${base}/rest/v1/app_settings`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  const response = await fetch(url, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error(`Content storage returned ${response.status}`);
  return response.status === 204 ? [] : response.json();
}

export async function getPosts() {
  const rows = await request({ select: 'value', key: `eq.${BLOG_KEY}`, limit: '1' });
  const value = rows[0]?.value;
  const posts = Array.isArray(value) ? value : (typeof value === 'string' ? JSON.parse(value) : []);
  return Array.isArray(posts) ? posts : [];
}

export async function savePosts(posts) {
  const payload = { key: BLOG_KEY, value: posts };
  const updated = await request({ key: `eq.${BLOG_KEY}` }, 'PATCH', { value: posts });
  if (updated.length) return;
  try {
    await request({}, 'POST', payload);
  } catch (error) {
    // Another request may have created the singleton key between the read and insert.
    const check = await request({ select: 'key', key: `eq.${BLOG_KEY}`, limit: '1' });
    if (!check.length) throw error;
    await request({ key: `eq.${BLOG_KEY}` }, 'PATCH', { value: posts });
  }
}

export function normalizePost(input, previous = {}) {
  const title = String(input?.title ?? '').trim().slice(0, 180);
  const slug = String(input?.slug ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
  const content = String(input?.content ?? '').trim().slice(0, 30000);
  const image = String(input?.featuredImage ?? '').trim().slice(0, 1000);
  const publishedAt = String(input?.publishedAt ?? '').trim().slice(0, 40);
  if (!title || !slug || !content) invalid('Add a title, URL slug, and article content.');
  if (image) {
    let parsed;
    try { parsed = new URL(image); } catch { invalid('Featured image must be a valid HTTPS URL.'); }
    if (parsed.protocol !== 'https:') invalid('Featured image must be a valid HTTPS URL.');
  }
  if (publishedAt && !Number.isFinite(Date.parse(publishedAt))) invalid('Publication date is invalid.');
  return {
    id: previous.id || randomUUID(),
    title,
    slug,
    content,
    featuredImage: image,
    publishedAt: publishedAt ? new Date(publishedAt).toISOString() : '',
    status: input?.status === 'published' ? 'published' : 'draft',
    createdAt: previous.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
