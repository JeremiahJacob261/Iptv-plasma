const prefix=()=>process.env.PLASMAX_ANALYTICS_PREFIX||'plasmax_iptv';
function config(){const base=process.env.PLASMAX_SUPABASE_URL,key=process.env.PLASMAX_SUPABASE_SERVICE_KEY;if(!base||!key)throw new Error('Analytics unavailable');return {base:base.replace(/\/$/,''),key};}
async function query(params,method='GET',body){const {base,key}=config();const url=new URL(base+'/rest/v1/app_settings');for(const [k,v] of Object.entries(params))url.searchParams.set(k,v);const r=await fetch(url,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(7000)});if(!r.ok){const e=new Error('Analytics database unavailable');e.status=r.status;throw e;}return r.status===204?[]:r.json();}
export function dayKey(kind,date=new Date()){return `${prefix()}_${kind}_${date.toISOString().slice(0,10)}`;}
export async function increment(key){for(let attempt=0;attempt<5;attempt++){const rows=await query({select:'value',key:'eq.'+key,limit:'1'});if(!rows.length){try{await query({},'POST',{key,value:1});return 1;}catch(e){if(e.status===409)continue;throw e;}}const old=rows[0].value,num=Number(old);if(!Number.isSafeInteger(num)||num<0)throw new Error('Invalid analytics counter');const updated=await query({key:'eq.'+key,value:'eq.'+old},'PATCH',{value:num+1});if(updated.length)return num+1;}throw new Error('Analytics update busy');}
const channelPrefix = () => `${prefix()}_channel_`;

export function channelPlayKey(channel, date = new Date()) {
  if (typeof channel?.id !== 'string' || !/^[a-zA-Z0-9_.@-]{1,120}$/.test(channel.id)) return null;
  if (typeof channel.name !== 'string') return null;
  const name = [...channel.name.replace(/[\p{C}]/gu, '').replace(/\s+/g, ' ').trim()].slice(0, 100).join('');
  if (!name || /https?:|www\./i.test(name)) return null;
  const identity = Buffer.from(JSON.stringify([channel.id, name])).toString('base64url');
  return `${channelPrefix()}${date.toISOString().slice(0, 10)}_${identity}`;
}

export async function recordViewer(channelKey, viewer) {
  if (!/^[a-f0-9]{32}$/.test(viewer || '')) return;
  const key = channelKey.replace('_channel_', '_viewer_') + '_' + viewer;
  try { await query({}, 'POST', { key, value: 1 }); } catch (error) { if (error.status !== 409) throw error; }
}

async function channelRows(firstDay, nextDay, kind = 'channel') {
  const base = `${prefix()}_${kind}_`;
  const start = `${base}${firstDay}`;
  const end = `${base}${nextDay}`;
  const rows = [];
  const size = 500;
  for (let offset = 0; ; offset += size) {
    const page = await query({
      select: 'key,value', and: `(key.gte.${start},key.lt.${end})`,
      order: 'key.asc', limit: String(size), offset: String(offset)
    });
    rows.push(...page);
    if (page.length < size) return rows;
  }
}

export async function analytics(days = 30, now = new Date()) {
  const isoDay = offset => new Date(now.valueOf() + offset * 86400000).toISOString().slice(0, 10);
  const daily = Array.from({ length: days }, (_, i) => ({ date: isoDay(i - days + 1), visits: 0, plays: 0 }));
  const byDay = new Map(daily.map(day => [day.date, day]));
  const firstDay = daily[0].date;
  const totals = await Promise.all(['visit', 'play'].map(kind => {
    const base = `${prefix()}_${kind}_`;
    return query({
      select: 'key,value', and: `(key.gte.${base}${firstDay},key.lt.${base}${isoDay(1)})`,
      order: 'key.asc', limit: String(days)
    });
  }).concat(channelRows(firstDay, isoDay(1)), channelRows(firstDay, isoDay(1), 'watch'), channelRows(firstDay, isoDay(1), 'viewer')));
  for (const [index, metric] of ['visits', 'plays'].entries()) {
    for (const row of totals[index]) {
      const day = byDay.get(row.key.slice(-10));
      if (day) day[metric] += Number(row.value) || 0;
    }
  }
  const channels = new Map();
  for (const row of totals[2]) {
    const suffix = row.key.slice(channelPrefix().length);
    const day = byDay.get(suffix.slice(0, 10));
    const plays = Number(row.value);
    if (!day || !Number.isSafeInteger(plays) || plays <= 0) continue;
    try {
      const [id, name] = JSON.parse(Buffer.from(suffix.slice(11), 'base64url').toString());
      day.plays += plays;
      const key = id.toLowerCase();
      const channel = channels.get(key);
      channels.set(key, { id, name, plays: (channel?.plays ?? 0) + plays, watchSeconds: channel?.watchSeconds ?? 0 });
    } catch {
      // Ignore malformed channel keys.
    }
  }
  for (const row of totals[3]) {
    try {
      const suffix = row.key.slice(`${prefix()}_watch_`.length);
      const [id, name] = JSON.parse(Buffer.from(suffix.slice(11), 'base64url').toString());
      const key = id.toLowerCase(), channel = channels.get(key) || { id, name, plays: 0, watchSeconds: 0 };
      channel.watchSeconds += (Number(row.value) || 0) * 30;
      channels.set(key, channel);
    } catch { /* Ignore malformed counters. */ }
  }
  const viewers = new Map();
  for (const row of totals[4]) {
    try {
      const suffix = row.key.slice(`${prefix()}_viewer_`.length);
      const marker = suffix.lastIndexOf('_');
      const [id] = JSON.parse(Buffer.from(suffix.slice(11, marker), 'base64url').toString());
      const key = id.toLowerCase();
      if (!viewers.has(key)) viewers.set(key, new Set());
      viewers.get(key).add(suffix.slice(marker + 1));
    } catch { /* Ignore malformed counters. */ }
  }
  const entries = [...channels.values()];
  for (const channel of entries) channel.viewers = viewers.get(channel.id.toLowerCase())?.size || 0;
  const maxPlays = Math.max(1, ...entries.map(c => c.viewers));
  const maxWatch = Math.max(1, ...entries.map(c => c.watchSeconds));
  for (const channel of entries) channel.score = Math.round(100 * (0.35 * channel.viewers / maxPlays + 0.65 * channel.watchSeconds / maxWatch));
  return {
    days, daily,
    visits: daily.reduce((total, day) => total + day.visits, 0),
    plays: daily.reduce((total, day) => total + day.plays, 0),
    channelCount: channels.size,
    channels: entries.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, 25)
  };
}

export async function loginAttempt(key,bucket){for(let attempt=0;attempt<5;attempt++){const rows=await query({select:'value',key:'eq.'+key,limit:'1'});if(!rows.length){try{await query({},'POST',{key,value:bucket*10+1});return 1;}catch(e){if(e.status===409)continue;throw e;}}const old=rows[0].value,num=Number(old);if(!Number.isSafeInteger(num)||num<0)throw new Error('Invalid rate-limit counter');const current=Math.floor(num/10)===bucket?num%10:0;if(current>=5)return 6;const updated=await query({key:'eq.'+key,value:'eq.'+old},'PATCH',{value:bucket*10+current+1});if(updated.length)return current+1;}throw new Error('Rate limiter busy');}
