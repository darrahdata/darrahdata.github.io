const EVENT_NAMES = new Set([
  'page_view',
  'rosary_start',
  'rosary_complete',
  'chaplet_start',
  'chaplet_complete',
  'common_prayer_start',
  'common_prayer_complete',
  'mystery_study_start',
  'mystery_study_complete'
]);

const MYSTERIES = new Set(['joyful', 'sorrowful', 'glorious', 'luminous', '']);
const STYLES = new Set(['one', 'five', 'darrah', 'dominican', '']);
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin = getAllowedOrigin(origin, env);

    if (request.method === 'OPTIONS') {
      if (!allowedOrigin) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(allowedOrigin) });
    }

    try {
      if (request.method === 'POST' && url.pathname === '/collect') {
        if (!allowedOrigin) return json({ error: 'Origin not allowed' }, 403);
        return await collectEvent(request, env, allowedOrigin);
      }

      if (request.method === 'POST' && url.pathname === '/login') {
        if (!allowedOrigin) return json({ error: 'Origin not allowed' }, 403);
        return await login(request, env, allowedOrigin);
      }

      if (request.method === 'GET' && url.pathname === '/api/summary') {
        if (!allowedOrigin) return json({ error: 'Origin not allowed' }, 403);
        const authenticated = await verifySession(request, env);
        if (!authenticated) return json({ error: 'Session expired' }, 401, allowedOrigin);
        return await analyticsSummary(url, env, allowedOrigin);
      }

      if (request.method === 'GET' && url.pathname === '/health') {
        return json({ ok: true, service: 'rosary-usage-analytics' });
      }

      return json({ error: 'Not found' }, 404, allowedOrigin || undefined);
    } catch (error) {
      console.error('analytics request failed', error);
      return json({ error: 'Analytics service unavailable' }, 503, allowedOrigin || undefined);
    }
  }
};

async function collectEvent(request, env, allowedOrigin) {
  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > 4096) return json({ error: 'Payload too large' }, 413, allowedOrigin);

  const body = await request.json().catch(() => null);
  if (!body || !EVENT_NAMES.has(body.event)) {
    return json({ error: 'Invalid event' }, 400, allowedOrigin);
  }

  const mystery = cleanChoice(body.mystery, MYSTERIES);
  const style = cleanChoice(body.style, STYLES);
  const item = cleanLabel(body.item, 64);
  const day = dayKey(new Date(), env.ANALYTICS_TIMEZONE);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  const visitorHash = await hmacHex(env.HASH_SALT, `${day}|${ip}|${userAgent}`);

  const insertion = await env.DB.prepare(
    'INSERT OR IGNORE INTO daily_visitors (day, visitor_hash) VALUES (?, ?)'
  ).bind(day, visitorHash).run();
  const isNewVisitor = Number(insertion.meta?.changes || 0) > 0 ? 1 : 0;
  const pageView = body.event === 'page_view' ? 1 : 0;
  let newVisitor = 0;
  let returningVisitor = 0;

  if (isNewVisitor) {
    const rollingHash = await hmacHex(env.HASH_SALT, `rolling-30-day|${ip}|${userAgent}`);
    const rollingCutoff = dayKey(new Date(Date.now() - 30 * 86400000), env.ANALYTICS_TIMEZONE);
    const profile = await env.DB.prepare(
      'SELECT first_seen_day, last_seen_day, active_days FROM rolling_visitors WHERE visitor_hash = ?'
    ).bind(rollingHash).first();
    const seenWithinWindow = Boolean(profile && profile.last_seen_day >= rollingCutoff && profile.last_seen_day < day);
    returningVisitor = seenWithinWindow ? 1 : 0;
    newVisitor = seenWithinWindow ? 0 : 1;

    await env.DB.prepare(`
      INSERT INTO rolling_visitors (visitor_hash, first_seen_day, last_seen_day, active_days)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(visitor_hash) DO UPDATE SET
        first_seen_day = CASE
          WHEN rolling_visitors.last_seen_day < ? THEN excluded.first_seen_day
          ELSE rolling_visitors.first_seen_day
        END,
        last_seen_day = excluded.last_seen_day,
        active_days = CASE
          WHEN rolling_visitors.last_seen_day < ? THEN 1
          WHEN rolling_visitors.last_seen_day < excluded.last_seen_day THEN rolling_visitors.active_days + 1
          ELSE rolling_visitors.active_days
        END
    `).bind(rollingHash, day, day, rollingCutoff, rollingCutoff).run();
  }

  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO daily_totals (day, unique_visitors, page_views, new_visitors, returning_visitors)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(day) DO UPDATE SET
        unique_visitors = unique_visitors + excluded.unique_visitors,
        page_views = page_views + excluded.page_views,
        new_visitors = new_visitors + excluded.new_visitors,
        returning_visitors = returning_visitors + excluded.returning_visitors
    `).bind(day, isNewVisitor, pageView, newVisitor, returningVisitor),
    env.DB.prepare(`
      INSERT INTO daily_events (day, event, mystery, style, item, count)
      VALUES (?, ?, ?, ?, ?, 1)
      ON CONFLICT(day, event, mystery, style, item) DO UPDATE SET
        count = count + 1
    `).bind(day, body.event, mystery, style, item)
  ]);

  if (body.event === 'page_view') {
    const cutoff = dayKey(new Date(Date.now() - 3 * 86400000), env.ANALYTICS_TIMEZONE);
    const rollingCutoff = dayKey(new Date(Date.now() - 30 * 86400000), env.ANALYTICS_TIMEZONE);
    Promise.all([
      env.DB.prepare('DELETE FROM daily_visitors WHERE day < ?').bind(cutoff).run(),
      env.DB.prepare('DELETE FROM rolling_visitors WHERE last_seen_day < ?').bind(rollingCutoff).run()
    ]).catch(console.error);
  }

  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(allowedOrigin),
      'Cache-Control': 'no-store'
    }
  });
}

async function login(request, env, allowedOrigin) {
  const body = await request.json().catch(() => null);
  const candidate = String(body?.password || '');
  if (!candidate || !env.DASHBOARD_PASSWORD) {
    await delayFailedLogin();
    return json({ error: 'Incorrect password' }, 401, allowedOrigin);
  }

  if (!timingSafeStringEqual(candidate, env.DASHBOARD_PASSWORD)) {
    await delayFailedLogin();
    return json({ error: 'Incorrect password' }, 401, allowedOrigin);
  }

  const expiresAt = Date.now() + 12 * 60 * 60 * 1000;
  const payload = toBase64Url(encoder.encode(JSON.stringify({ exp: expiresAt, nonce: crypto.randomUUID() })));
  const signature = await hmacBase64Url(env.SESSION_SECRET, payload);
  return json({ token: `${payload}.${signature}`, expiresAt }, 200, allowedOrigin);
}

async function verifySession(request, env) {
  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) return false;
  const token = authorization.slice(7);
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return false;

  const expected = await hmacBase64Url(env.SESSION_SECRET, payload);
  if (!timingSafeStringEqual(signature, expected)) return false;

  try {
    const parsed = JSON.parse(decoder.decode(fromBase64Url(payload)));
    return Number.isFinite(parsed.exp) && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

async function analyticsSummary(url, env, allowedOrigin) {
  const range = parseRange(url, env.ANALYTICS_TIMEZONE);

  const [daily, events, rolling] = await Promise.all([
    env.DB.prepare(`
      SELECT day, unique_visitors, page_views, new_visitors, returning_visitors
      FROM daily_totals
      WHERE day >= ?
      ORDER BY day ASC
    `).bind(range.startDate).all(),
    env.DB.prepare(`
      SELECT event, mystery, style, item, SUM(count) AS count
      FROM daily_events
      WHERE day >= ?
      GROUP BY event, mystery, style, item
      ORDER BY count DESC
    `).bind(range.startDate).all(),
    env.DB.prepare(`
      SELECT
        COUNT(*) AS active_profiles,
        SUM(CASE WHEN active_days > 1 THEN 1 ELSE 0 END) AS repeat_profiles
      FROM rolling_visitors
      WHERE last_seen_day >= ?
    `).bind(dayKey(new Date(Date.now() - 30 * 86400000), env.ANALYTICS_TIMEZONE)).first()
  ]);

  return json({
    range,
    retentionDays: 30,
    generatedAt: new Date().toISOString(),
    daily: daily.results || [],
    events: events.results || [],
    rolling: rolling || { active_profiles: 0, repeat_profiles: 0 }
  }, 200, allowedOrigin);
}

function parseRange(url, timeZone = 'America/Los_Angeles') {
  const units = new Set(['days', 'weeks', 'months', 'years']);
  const unit = units.has(url.searchParams.get('unit')) ? url.searchParams.get('unit') : 'days';
  const limits = { days: 3650, weeks: 520, months: 120, years: 10 };
  const fallback = unit === 'days' ? 30 : 1;
  const parsedValue = Number.parseInt(url.searchParams.get('value') || url.searchParams.get('days') || fallback, 10);
  const value = Math.max(1, Math.min(Number.isFinite(parsedValue) ? parsedValue : fallback, limits[unit]));
  const endDate = dayKey(new Date(), timeZone);
  const anchor = new Date(`${endDate}T12:00:00Z`);

  if (unit === 'days') anchor.setUTCDate(anchor.getUTCDate() - (value - 1));
  if (unit === 'weeks') anchor.setUTCDate(anchor.getUTCDate() - (value * 7 - 1));
  if (unit === 'months') anchor.setUTCMonth(anchor.getUTCMonth() - value);
  if (unit === 'years') anchor.setUTCFullYear(anchor.getUTCFullYear() - value);

  const startDate = anchor.toISOString().slice(0, 10);
  const dayCount = Math.round((new Date(`${endDate}T12:00:00Z`) - new Date(`${startDate}T12:00:00Z`)) / 86400000) + 1;
  const singular = unit.slice(0, -1);
  return {
    value,
    unit,
    startDate,
    endDate,
    dayCount,
    label: `Last ${value} ${value === 1 ? singular : unit}`
  };
}

function getAllowedOrigin(origin, env) {
  if (!origin) return '';
  const configured = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  if (configured.includes(origin)) return origin;
  if (/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) return origin;
  return '';
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function json(value, status = 200, origin) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  };
  if (origin) Object.assign(headers, corsHeaders(origin));
  return new Response(JSON.stringify(value), { status, headers });
}

function cleanChoice(value, allowed) {
  const normalized = String(value || '').toLowerCase();
  return allowed.has(normalized) ? normalized : '';
}

function cleanLabel(value, maxLength) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .trim()
    .slice(0, maxLength);
}

function dayKey(date, timeZone = 'America/Los_Angeles') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function timingSafeStringEqual(left, right) {
  const leftBytes = encoder.encode(String(left));
  const rightBytes = encoder.encode(String(right));
  if (leftBytes.byteLength !== rightBytes.byteLength) {
    crypto.subtle.timingSafeEqual(leftBytes, leftBytes);
    return false;
  }
  return crypto.subtle.timingSafeEqual(leftBytes, rightBytes);
}

async function hmacBytes(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(String(secret || '')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

async function hmacHex(secret, value) {
  const bytes = await hmacBytes(secret, value);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function hmacBase64Url(secret, value) {
  return toBase64Url(await hmacBytes(secret, value));
}

function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function delayFailedLogin() {
  return new Promise(resolve => setTimeout(resolve, 350));
}
