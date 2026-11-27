const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('../exchange/node_modules/jsdom');

const page = fs.readFileSync(path.join(__dirname, '../dist/precious-metals/index.html'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, '../dist/precious-metals.js'), 'utf8');
const brandScript = fs.readFileSync(path.join(__dirname, '../dist/brand.js'), 'utf8');
const sample = {
  metals: [
    { symbol: 'XAU', name: 'Gold', ask: 4040, bid: 4000, mid: 4020, updatedAt: '2026-11-27T14:00:00Z', changeToday: { amount: 10, percent: .25 }, changes: { '1w': 1.2, '1m': -2.1, '1y': 4.8 } },
    { symbol: 'XAG', name: 'Silver', ask: 42, bid: 38, mid: 40, updatedAt: '2026-11-27T14:00:00Z', changeToday: { amount: 1, percent: 2 }, changes: { '1w': 2, '1m': 3, '1y': 4 } },
    { symbol: 'XPT', name: 'Platinum', ask: 1320, bid: 1280, mid: 1300, updatedAt: '2026-11-27T14:00:00Z', changeToday: { amount: -4, percent: -.3 }, changes: { '1w': -1, '1m': 2, '1y': -5 } }
  ],
  points: [{ t: '2026-11-01T00:00:00Z', price: 3900 }, { t: '2026-11-15T00:00:00Z', price: 3950 }, { t: '2026-11-27T00:00:00Z', price: 4020 }],
  fx: { name: 'Exchange API', date: '2026-11-27', rates: { USD: 1, EUR: .9, CAD: 1.4, NGN: 1500 } },
  source: { name: 'Standard Bullion', updatedAt: '2026-11-27T14:00:00Z' }
};
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
function setup(fetcher) {
  const dom = new JSDOM(page, { url: 'https://plasmax.test/precious-metals/', runScripts: 'outside-only' });
  dom.window.fetch = fetcher;
  dom.window.eval(script);
  return dom;
}

test('metals tracker supports every metal, currency, unit and chart period with stable conversions', async () => {
  const requests = [];
  const dom = setup(async url => {
    requests.push(new URL(url, 'https://plasmax.test'));
    return { ok: true, json: async () => sample };
  });
  try {
    await tick();
    const w = dom.window, d = w.document;
    const expected = { XAU: 4020, XAG: 40, XPT: 1300 };
    const rates = { USD: 1, EUR: .9, CAD: 1.4, NGN: 1500 };
    for (const metal of Object.keys(expected)) {
      d.querySelector(`[data-metal="${metal}"]`).click(); await tick();
      for (const period of ['24h', '7d', '1m', '3m', '6m', '1y', '5y']) {
        d.querySelector(`[data-period="${period}"]`).click(); await tick();
        for (const currency of Object.keys(rates)) {
          d.querySelector('#pm-currency').value = currency;
          d.querySelector('#pm-currency').dispatchEvent(new w.Event('change'));
          for (const unit of ['oz', 'g']) {
            d.querySelector('#pm-unit').value = unit;
            d.querySelector('#pm-unit').dispatchEvent(new w.Event('change'));
            const converted = expected[metal] * rates[currency] / (unit === 'g' ? 31.1034768 : 1);
            const expectedPrice = new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(converted);
            assert.match(d.querySelector('#pm-price').textContent, new RegExp(expectedPrice.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
            assert.match(d.querySelector('#pm-chart svg').getAttribute('aria-label'), /chart/);
            assert.equal(d.querySelector(`[data-metal="${metal}"]`).getAttribute('aria-pressed'), 'true');
            assert.equal(d.querySelector(`[data-period="${period}"]`).getAttribute('aria-pressed'), 'true');
          }
        }
      }
    }
    assert.equal(requests.length, 25);
    assert.equal(new Set(requests.map(url => `${url.searchParams.get('metal')}:${url.searchParams.get('period')}`)).size, 21);
    assert.equal(d.querySelector('#pm-fx-updated').textContent.includes('2026-11-27'), true);
    assert.equal(d.querySelector('#pm-performance').children.length, 4);
  } finally { dom.window.close(); }
});

test('tracker handles unavailable market feeds without displaying a made-up price', async () => {
  const dom = setup(async () => ({ ok: false, json: async () => ({ error: 'Price data is temporarily unavailable.' }) }));
  try {
    await tick();
    assert.equal(dom.window.document.querySelector('#pm-price').textContent, 'Price unavailable');
    assert.match(dom.window.document.querySelector('#pm-chart').textContent, /temporarily unavailable/);
  } finally { dom.window.close(); }
});

test('public insights render article text safely and link to a dedicated article route', async () => {
  const html = '<!doctype html><body><div id="pm-post-list" class="pm-post-grid"></div></body>';
  const dom = new JSDOM(html, { url: 'https://plasmax.test/precious-metals/', runScripts: 'outside-only' });
  dom.window.fetch = async () => ({ ok: true, json: async () => ({ posts: [{ slug: 'gold-basics', title: '<img src=x onerror=alert(1)> Gold guide', content: 'First paragraph.\n\nSecond paragraph.', publishedAt: '2026-11-27T00:00:00Z' }] }) });
  try {
    dom.window.eval(fs.readFileSync(path.join(__dirname, '../dist/precious-blog.js'), 'utf8'));
    await tick();
    assert.equal(dom.window.document.querySelectorAll('#pm-post-list img').length, 0);
    assert.equal(dom.window.document.querySelector('#pm-post-list a').getAttribute('href'), '/precious-metals/blog/gold-basics');
    assert.match(dom.window.document.querySelector('#pm-post-list h3').textContent, /<img/);
  } finally { dom.window.close(); }
});


test('shared navigation includes Precious Metals alongside Exchange on all metals routes', () => {
  const html = '<!doctype html><html><head></head><body class="pm-page"><header class="pm-header"></header><main></main></body></html>';
  const dom = new JSDOM(html, { url: 'https://plasmax.test/precious-metals/blog/', runScripts: 'outside-only' });
  try {
    dom.window.eval(brandScript);
    const nav = dom.window.document.querySelector('#plasma-public-header nav[aria-label="Main navigation"]');
    const links = [...nav.querySelectorAll('a')].map(link => link.textContent.trim()).filter(Boolean);
    assert.ok(links.includes('Exchange'));
    assert.ok(links.includes('Precious Metals'));
    assert.equal(nav.querySelector('a[href="/precious-metals/"]')?.getAttribute('aria-current'), 'page');
    assert.equal(dom.window.document.querySelectorAll('.pm-header').length, 0);
  } finally { dom.window.close(); }
});
