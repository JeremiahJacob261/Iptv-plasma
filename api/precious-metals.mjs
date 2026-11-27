const spotUrl = 'https://standardbullion.com/spot-prices.json';
const fxUrl = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
const ranges = new Set(['24h', '7d', '1m', '3m', '6m', '1y', '5y']);
const metals = new Set(['XAU', 'XAG', 'XPT']);
const json = value => JSON.stringify(value);

async function readJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(9000), headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Market source returned ${response.status}`);
  return response.json();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const metal = String(req.query.metal || 'XAU').toUpperCase();
  const period = String(req.query.period || '1m');
  if (!metals.has(metal) || !ranges.has(period)) return res.status(400).json({ error: 'Choose a supported metal and chart period.' });

  try {
    const [spot, fx, history] = await Promise.all([
      readJson(spotUrl),
      readJson(fxUrl),
      readJson(`https://standardbullion.com/api/v1/market/history?metal=${metal}&range=${period}`)
    ]);
    const prices = spot?.metals || [];
    const points = Array.isArray(history?.points) ? history.points.filter(p => Number.isFinite(p.price) && Number.isFinite(Date.parse(p.t))) : [];
    if (!prices.some(item => metals.has(item.symbol)) || !points.length) throw new Error('Market source did not return usable prices.');
    const rates = fx?.usd || {};
    const currencies = { USD: 1, EUR: rates.eur, CAD: rates.cad, NGN: rates.ngn };
    if (Object.values(currencies).some(rate => !Number.isFinite(rate) || rate <= 0)) throw new Error('Currency source is missing a required exchange rate.');
    const latestTimestamp = spot.updated || spot.metals.find(p => p.updatedAt)?.updatedAt || new Date().toISOString();
    res.setHeader('Cache-Control', `public, s-maxage=${period === '24h' || period === '7d' ? 300 : 1800}, stale-while-revalidate=3600`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).json({
      metals: prices.filter(item => metals.has(item.symbol)).map(item => ({
        symbol: item.symbol,
        name: item.name,
        ask: item.ask,
        bid: item.bid,
        mid: (item.ask + item.bid) / 2,
        open: item.open,
        changeToday: item.changeToday || null,
        changes: item.changes || {},
        updatedAt: latestTimestamp
      })),
      selected: metal,
      period,
      points,
      source: { name: 'Standard Bullion', url: 'https://standardbullion.com/market-data', attribution: 'Data by Standard Bullion', updatedAt: latestTimestamp, priceType: 'Indicative live dealer midpoint' },
      fx: { name: 'Exchange API', url: 'https://github.com/fawazahmed0/exchange-api', attribution: 'Currency rates by fawazahmed0 Exchange API', date: fx.date, rates: currencies },
      historyUnit: history.unit || 'USD per troy ounce',
      historyGrain: history.grain || 'daily'
    });
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'Price data is temporarily unavailable. Please try again shortly.' });
  }
}
