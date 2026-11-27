import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/precious-metals.mjs';

const metals = ['XAU', 'XAG', 'XPT'];
const periods = ['24h', '7d', '1m', '3m', '6m', '1y', '5y'];
function response() {
  return { statusCode: 200, headers: {}, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, setHeader(key, value) { this.headers[key] = value; } };
}

test('market API serves all supported metal and period selections with timestamped FX and cache headers', async t => {
  const oldFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async url => {
    const parsed = new URL(url); calls.push(parsed);
    if (parsed.hostname === 'standardbullion.com' && parsed.pathname === '/spot-prices.json') return Response.json({ updated: '2026-11-27T14:00:00Z', metals: metals.map((symbol, index) => ({ symbol, name: symbol, ask: 101 + index, bid: 99 + index, open: 98, changeToday: { amount: 2, percent: 2 }, changes: { '1w': 3, '1m': 4, '1y': 5 } })) });
    if (parsed.hostname === 'standardbullion.com') return Response.json({ metal: parsed.searchParams.get('metal'), range: parsed.searchParams.get('range'), unit: 'USD per troy ounce', grain: 'daily', points: [{ t: '2026-11-01T00:00:00Z', price: 99 }, { t: '2026-11-27T00:00:00Z', price: 101 }] });
    return Response.json({ date: '2026-11-27', usd: { eur: .9, cad: 1.4, ngn: 1500 } });
  };
  t.after(() => { globalThis.fetch = oldFetch; });

  for (const metal of metals) for (const period of periods) {
    const res = response();
    await handler({ method: 'GET', query: { metal, period } }, res);
    assert.equal(res.statusCode, 200, `${metal}/${period}`);
    assert.equal(res.body.selected, metal);
    assert.equal(res.body.period, period);
    assert.equal(res.body.points.length, 2);
    assert.deepEqual(res.body.fx.rates, { USD: 1, EUR: .9, CAD: 1.4, NGN: 1500 });
    assert.ok(res.body.source.updatedAt);
    assert.match(res.headers['Cache-Control'], /s-maxage=/);
  }
  const historyCalls = calls.filter(url => url.pathname.endsWith('/market/history'));
  assert.equal(historyCalls.length, 21);
  assert.equal(new Set(historyCalls.map(url => `${url.searchParams.get('metal')}/${url.searchParams.get('range')}`)).size, 21);
});

test('invalid market selection is rejected without requesting providers', async t => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Should not be called'); };
  t.after(() => { globalThis.fetch = oldFetch; });
  const res = response();
  await handler({ method: 'GET', query: { metal: 'XPD', period: 'all' } }, res);
  assert.equal(res.statusCode, 400);
});
