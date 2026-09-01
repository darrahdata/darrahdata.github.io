CREATE TABLE IF NOT EXISTS daily_visitors (
  day TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (day, visitor_hash)
);

CREATE TABLE IF NOT EXISTS daily_totals (
  day TEXT PRIMARY KEY,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  page_views INTEGER NOT NULL DEFAULT 0,
  new_visitors INTEGER NOT NULL DEFAULT 0,
  returning_visitors INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rolling_visitors (
  visitor_hash TEXT PRIMARY KEY,
  first_seen_day TEXT NOT NULL,
  last_seen_day TEXT NOT NULL,
  active_days INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS daily_events (
  day TEXT NOT NULL,
  event TEXT NOT NULL,
  mystery TEXT NOT NULL DEFAULT '',
  style TEXT NOT NULL DEFAULT '',
  item TEXT NOT NULL DEFAULT '',
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, event, mystery, style, item)
);

CREATE INDEX IF NOT EXISTS idx_daily_events_day ON daily_events(day);
CREATE INDEX IF NOT EXISTS idx_daily_events_event ON daily_events(event);
CREATE INDEX IF NOT EXISTS idx_rolling_visitors_last_seen ON rolling_visitors(last_seen_day);
