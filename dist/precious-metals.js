(() => {
  const $ = selector => document.querySelector(selector);
  const api = '/api/precious-metals';
  const currencyNames = { USD: 'US dollar', EUR: 'Euro', CAD: 'Canadian dollar', NGN: 'Nigerian naira' };
  const symbols = { USD: '$', EUR: '€', CAD: 'CA$', NGN: '₦' };
  const unitNames = { oz: 'troy ounce', g: 'gram' };
  const gramsPerTroyOunce = 31.1034768;
  let metal = 'XAU', period = '1m', currency = 'USD', unit = 'oz', report = null;

  const formatMoney = value => new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', { style: 'currency', currency, maximumFractionDigits: currency === 'NGN' ? 2 : 2 }).format(value);
  const ouncePrice = item => item.mid * report.fx.rates[currency];
  const unitPrice = item => ouncePrice(item) / (unit === 'g' ? gramsPerTroyOunce : 1);
  const dateLabel = value => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(value));
  const periodNames = { '24h': '1 day', '7d': '1 week', '1m': '1 month', '3m': '3 months', '6m': '6 months', '1y': '1 year', '5y': '5 years' };
  const setText = (selector, value) => { const node = $(selector); if (node) node.textContent = value; };

  function drawChart() {
    if (!report) return;
    const container = $('#pm-chart');
    const item = report.metals.find(entry => entry.symbol === metal);
    const points = report.points;
    if (!item || !points.length) { container.innerHTML = '<p class="pm-loading">No history is available for this selection.</p>'; return; }
    const values = points.map(point => point.price * report.fx.rates[currency] / (unit === 'g' ? gramsPerTroyOunce : 1));
    const min = Math.min(...values), max = Math.max(...values), span = max - min || max * .01 || 1;
    const width = 1000, height = 260, left = 10, right = 990, top = 13, bottom = 236;
    const xy = values.map((value, index) => [left + (right - left) * index / Math.max(1, values.length - 1), bottom - (value - min) / span * (bottom - top)]);
    const line = xy.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
    const area = `${line} L${right},${bottom} L${left},${bottom} Z`;
    const latest = values.at(-1), first = values[0], change = latest - first, percent = first ? change / first * 100 : 0;
    const last = xy.at(-1);
    const safeLabel = `${item.name} ${periodNames[period]} chart, ${formatMoney(first)} to ${formatMoney(latest)} per ${unitNames[unit]}`.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    container.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${safeLabel}"><defs><linearGradient id="pm-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#bb81e3" stop-opacity=".28"/><stop offset="100%" stop-color="#bb81e3" stop-opacity="0"/></linearGradient></defs><path class="pm-grid-line" d="M${left} 68H${right} M${left} 145H${right} M${left} ${bottom}H${right}"/><path d="${area}" fill="url(#pm-fill)"/><path d="${line}" fill="none" stroke="#c38ce8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${last[0]}" cy="${last[1]}" r="5" fill="#f3e5ff" stroke="#a969dc" stroke-width="3"/></svg>`;
    const direction = change >= 0 ? '+' : '−';
    const changeEl = $('#pm-change');
    changeEl.textContent = `${direction}${formatMoney(Math.abs(change))} (${direction}${Math.abs(percent).toFixed(2)}%) over ${periodNames[period]}`;
    changeEl.classList.toggle('negative', change < 0);
    $('#pm-chart-start').textContent = dateLabel(points[0].t);
    $('#pm-chart-end').textContent = dateLabel(points.at(-1).t);
    $('#pm-chart-caption').textContent = `Converted using the ${currency} daily FX rate${currency === 'USD' ? '' : ` · ${report.fx.date}`}`;
  }

  function render() {
    if (!report) return;
    const item = report.metals.find(entry => entry.symbol === metal);
    if (!item) return;
    setText('.pm-selected-label', `${item.name} · Indicative spot midpoint`);
    setText('#pm-price', `${formatMoney(unitPrice(item))} / ${unitNames[unit]}`);
    const dayChange = item.changeToday;
    if (dayChange && Number.isFinite(dayChange.amount)) {
      const amount = dayChange.amount * report.fx.rates[currency] / (unit === 'g' ? gramsPerTroyOunce : 1);
      const sign = amount >= 0 ? '+' : '−';
      setText('#pm-change', `${sign}${formatMoney(Math.abs(amount))} (${sign}${Math.abs(dayChange.percent).toFixed(2)}%) today`);
      $('#pm-change').classList.toggle('negative', amount < 0);
    }
    const changePeriods = [
      ['Today', dayChange?.percent], ['1 week', item.changes?.['1w']], ['1 month', item.changes?.['1m']], ['1 year', item.changes?.['1y']]
    ];
    const performance = $('#pm-performance');
    performance.replaceChildren(...changePeriods.map(([label, value]) => {
      const cell = document.createElement('div'), name = document.createElement('span'), amount = document.createElement('strong');
      name.textContent = label;
      if (Number.isFinite(value)) { amount.textContent = `${value > 0 ? '+' : ''}${Number(value).toFixed(2)}%`; amount.className = Number(value) < 0 ? 'negative' : 'positive'; }
      else amount.textContent = '—';
      cell.append(name, amount); return cell;
    }));
    setText('#pm-updated', `Metal quote · ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.updatedAt))}`);
    setText('#pm-fx-updated', `FX reference · ${report.fx.date} · ${report.fx.name}`);
    drawChart();
  }

  async function load() {
    const chart = $('#pm-chart');
    chart.innerHTML = '<p class="pm-loading">Loading price history…</p>';
    setText('#pm-price', 'Loading prices…');
    try {
      const response = await fetch(`${api}?metal=${encodeURIComponent(metal)}&period=${encodeURIComponent(period)}`, { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Price data is temporarily unavailable.');
      report = data;
      render();
    } catch (error) {
      report = null;
      setText('#pm-price', 'Price unavailable');
      setText('#pm-change', error.message || 'Please try again shortly.');
      chart.innerHTML = '<p class="pm-loading">Price history is temporarily unavailable. Choose another period or try again later.</p>';
    }
  }

  document.querySelectorAll('[data-metal]').forEach(button => button.addEventListener('click', () => {
    metal = button.dataset.metal;
    document.querySelectorAll('[data-metal]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    void load();
  }));
  document.querySelectorAll('[data-period]').forEach(button => button.addEventListener('click', () => {
    period = button.dataset.period;
    document.querySelectorAll('[data-period]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    void load();
  }));
  $('#pm-currency')?.addEventListener('change', event => { currency = event.target.value; render(); });
  $('#pm-unit')?.addEventListener('change', event => { unit = event.target.value; render(); });
  void load();
})();
