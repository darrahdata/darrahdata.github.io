// A shared calendar cycle: local September 7, 2026 is the first day.
// Calendar components avoid 23/25-hour DST days and UTC date shifts.
const DAY = 86_400_000;
const EPOCH = Date.UTC(2026, 8, 7) / DAY;

export function localDateKey(date = new Date()) {
  if (Number.isNaN(date.getTime())) throw new RangeError('A valid date is required.');
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function dailyIndex(length, date = new Date()) {
  if (!Number.isInteger(length) || length < 1) throw new RangeError('A cycle needs at least one item.');
  localDateKey(date);
  const day = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY - EPOCH;
  return ((day % length) + length) % length;
}

export function dailyItem(items, date = new Date()) {
  const index = dailyIndex(items.length, date);
  return { item: items[index], index, total: items.length, dateKey: localDateKey(date) };
}

export function watchLocalDay(onChange, {
  now = () => new Date(), timers = globalThis,
  windowTarget = window, documentTarget = document
} = {}) {
  let previous = '', timeout, stopped = false;
  function check() {
    if (stopped) return;
    const date = now();
    // Refresh stored Date objects when the timezone changes even if today's
    // date stays the same: an older timestamp may now fall on yesterday.
    const key = `${localDateKey(date)}:${date.getTimezoneOffset()}`;
    if (key !== previous) { previous = key; onChange(date); }
    timers.clearTimeout(timeout);
    const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    // Midnight timer plus a light clock/timezone-change check while left open.
    timeout = timers.setTimeout(check, Math.min(60_000, Math.max(25, midnight - date + 25)));
  }
  windowTarget.addEventListener('focus', check);
  windowTarget.addEventListener('pageshow', check);
  documentTarget.addEventListener('visibilitychange', check);
  check();
  return () => {
    stopped = true;
    timers.clearTimeout(timeout);
    windowTarget.removeEventListener('focus', check);
    windowTarget.removeEventListener('pageshow', check);
    documentTarget.removeEventListener('visibilitychange', check);
  };
}
