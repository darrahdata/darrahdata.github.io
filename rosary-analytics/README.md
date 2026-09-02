# Rosary usage analytics

The public dashboard shell lives at:

`https://darrahdata.github.io/rosary-analytics/`

The production collection service is deployed at:

`https://rosary-usage-analytics.darrahdata-rosary.workers.dev`

The Cloudflare D1 database is configured in `wrangler.jsonc`. Dashboard and hashing secrets are stored only as encrypted Worker secrets and are not present in this repository.

The analytics data and password verification run in a Cloudflare Worker so that no password, session secret, database credential, IP address, or analytics data is published in the GitHub Pages source.

## Privacy model

- The browser sends only the event name and selected Rosary options.
- The Worker converts the request IP address and user agent into salted HMAC identifiers: one day-specific identifier for daily counts and one rolling identifier for new-versus-returning counts.
- Raw IP addresses, user agents, names, intentions, and prayer text are never stored.
- Daily identifiers are deleted after three days. Rolling identifiers are deleted after 30 inactive days; only aggregate daily counts remain longer.
- The same person may count more than once if they use different devices or browsers.
- The Rosary honors Global Privacy Control and the same-origin opt-out stored by `/privacy/`.
- The public notice at `/privacy/` explains the categories, purposes, retention period, service provider, and choices before a person starts praying.

The implementation is designed to minimize California privacy risk, but deployment should still be reviewed against the site's actual business practices and applicable law.

## First-time Cloudflare setup

1. Install dependencies with `pnpm install` in this directory.
2. Sign in with `npx wrangler login`.
3. Create the database: `npx wrangler d1 create rosary-analytics`.
4. Put the returned database ID into `wrangler.jsonc`.
5. Initialize it: `pnpm db:remote`.
6. Add three encrypted secrets:
   - `npx wrangler secret put DASHBOARD_PASSWORD`
   - `npx wrangler secret put SESSION_SECRET`
   - `npx wrangler secret put HASH_SALT`
7. Deploy with `pnpm deploy`.
8. Put the deployed Worker URL into the `rosary-analytics-api` meta tag in both `rosary-analytics/index.html` and `rosary-v2/index.html`.

Never commit `.dev.vars`, `.env`, passwords, salts, or API tokens. The repository `.gitignore` excludes those files.

## Local dashboard preview

Open `/rosary-analytics/?demo=1` to see the interface with clearly labeled sample data. Preview data is never sent to or stored by the analytics service.

The dashboard includes new users over time, returning users, and custom “Last X” ranges in days, weeks, months, or years. New and returning counts are pseudonymous visitor-days, not authenticated people.
