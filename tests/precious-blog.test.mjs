import { test } from 'node:test';
import assert from 'node:assert/strict';
import adminHandler from '../api/admin-api.mjs';
import publicHandler from '../api/precious-blog.mjs';
import { makeSession } from '../lib/plasmax-admin.mjs';

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
let storedPosts = [];
function response(status = 200, payload = {}) {
  return { statusCode: status, headers: {}, status(value) { this.statusCode = value; return this; }, setHeader(name, value) { this.headers[name] = value; }, json(value) { this.payload = value; return this; }, end() { return this; }, send(value) { this.payload = value; return this; } };
}
function request({ method = 'GET', route = 'precious-blog', body, authenticated = true } = {}) {
  const token = makeSession();
  return { method, query: { route }, body, headers: { host: 'plasmax.test', origin: 'https://plasmax.test', cookie: authenticated ? `plasmax_admin=${token}` : '' } };
}

test('authorized admin can draft, preview data, publish and unpublish while public reads expose published articles only', async t => {
  process.env.PLASMAX_ADMIN_PASSWORD = 'test-password';
  process.env.PLASMAX_ADMIN_SESSION_SECRET = 'test-session-secret-with-at-least-32-characters';
  process.env.PLASMAX_SUPABASE_URL = 'https://database.test';
  process.env.PLASMAX_SUPABASE_SERVICE_KEY = 'test-service-key';
  storedPosts = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(input);
    assert.equal(url.pathname, '/rest/v1/app_settings');
    if (init.method === 'PATCH') { storedPosts = JSON.parse(init.body).value; return Response.json(storedPosts.length ? [{ value: storedPosts }] : []); }
    if (init.method === 'POST') { storedPosts = JSON.parse(init.body).value; return Response.json([{ key: 'plasmax_precious_metals_blog_v1' }], { status: 201 }); }
    return Response.json(storedPosts.length ? [{ value: storedPosts }] : []);
  };
  t.after(() => { globalThis.fetch = originalFetch; process.env = originalEnv; });

  const unauthorized = response();
  await adminHandler(request({ authenticated: false }), unauthorized);
  assert.equal(unauthorized.statusCode, 401);

  const draft = response();
  await adminHandler(request({ method: 'POST', body: { action: 'save', post: { title: 'Gold basics', slug: 'gold-basics', content: 'A short guide.', featuredImage: '', publishedAt: '2026-11-27', status: 'draft' } } }), draft);
  assert.equal(draft.statusCode, 200);
  const id = draft.payload.post.id;
  assert.equal(draft.payload.post.status, 'draft');

  const publicBefore = response();
  await publicHandler({ method: 'GET', query: {} }, publicBefore);
  assert.deepEqual(publicBefore.payload.posts, []);

  const publish = response();
  await adminHandler(request({ method: 'POST', body: { action: 'publish', id, post: { ...draft.payload.post, publishedAt: '2026-11-27T12:00:00.000Z' } } }), publish);
  assert.equal(publish.statusCode, 200);
  assert.equal(publish.payload.post.status, 'published');

  const publicArticle = response();
  await publicHandler({ method: 'GET', query: { slug: 'gold-basics' } }, publicArticle);
  assert.equal(publicArticle.statusCode, 200);
  assert.equal(publicArticle.payload.post.title, 'Gold basics');

  const unpublish = response();
  await adminHandler(request({ method: 'POST', body: { action: 'unpublish', id } }), unpublish);
  assert.equal(unpublish.statusCode, 200);
  assert.equal(unpublish.payload.post.status, 'draft');

  const hiddenAgain = response();
  await publicHandler({ method: 'GET', query: { slug: 'gold-basics' } }, hiddenAgain);
  assert.equal(hiddenAgain.statusCode, 404);

  const invalidImage = response();
  await adminHandler(request({ method: 'POST', body: { action: 'save', post: { title: 'Unsafe image', slug: 'unsafe-image', content: 'Content', featuredImage: 'http://not-https.test/image.jpg' } } }), invalidImage);
  assert.equal(invalidImage.statusCode, 400);
});
