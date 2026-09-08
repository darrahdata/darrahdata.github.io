# Tiny Signs

Personal, noncommercial baby-sign vocabulary practice before and after baby arrives.

## Experience

- 138 signs covering everyday family life and Catholic faith.
- Home features a Sign of the day: one catalog entry per local calendar day, with a fixed September 7, 2026 epoch. The full 138-sign cycle restarts after the last entry. It refreshes at midnight and when returning to a suspended tab; no practice data or visit count affects selection.
- Watch → Copy → Use lessons with handshape, palm, location, movement, self-checks, and an optional private camera mirror.
- Native human reference clips with quarter/half speed, replay, repeat, 0.1-second seeking, and fullscreen where supported.
- Make the sign from memory, or watch an unlabeled clip and recall its meaning. Reveal, compare, and self-assess; no automatic signing accuracy claim.
- Review prioritizes signs marked “Practice again,” then new signs, then older reviews. Each round has up to five signs. Practiced signs are the default pool; beginners start with Milk, More, and All done.
- Separate practice, modeled-with-baby, and recall progress in existing localStorage. Old counts are preserved.
- App shell and written lessons cache after a successful online load. Settings downloads all 30 clips and posters (~34 MB). Saved videos support offline byte-range requests for playback and seeking. Browser storage may be evicted.

## Media and instructional status

All current clips and supplied poster images are from public ASL Signbank entries, with teal backgrounds. Videos are unmodified. They are licensed CC BY-NC-SA 4.0 for this noncommercial use, with full citations and direct source links in `public/credits.html` and `src/data/media.json`.

ASL Signbank is a research/annotation resource, not a narrated teaching curriculum. The clips supplement written practice cues and external explanations. No endorsement or independent educator review is claimed. Tiny Signs’ practice text and any media adaptations are shared under the same license. Commissioned close-up/side-view lessons and independent Deaf ASL educator review remain pending; see `docs/educator-review-and-recording-brief.md`.

Previously embedded ASL University videos have been removed after checking its publisher's restrictions on public app reuse. Ordinary links to fuller explanations remain available. No YouTube video is downloaded or cached.

## Development and publishing

```sh
pnpm install
pnpm run dev
pnpm run build
pnpm run test:offline
```

The build script creates `dist/index.html`, copies `public/`, and generates a versioned service worker from the exact built asset names. GitHub Pages serves files tracked at this directory’s root. Copy the build's index, assets, media, service worker, manifest, icon and credits here when publishing. Keep the app at `/tiny-signs/` as configured. The service worker handles only its own directory and only deletes caches beginning with `tiny-signs-shell-`.

When changing a media file in place, bump the media cache version in both `src/offline.js` and `scripts/sw-template.js` so saved content cannot stay stale. For immutable additions, the pack reconciles missing URLs.

## Verification

- All 30 MP4s decoded successfully; sampled frames checked for framing and selected variants. This is not an expert ASL review.
- Isolated React interaction checks: all lessons, controls, recall conceal/reveal and saved assessments, routine filters, preservation of practice/model history, offline unsupported state, camera fallback and stream cleanup.
- `pnpm run test:offline`: simulated service-worker install/activation, scope isolation, offline navigation, partial content and invalid video ranges, pack save/status/reuse/removal/cancellation.
- Production build succeeds. Full browser playback and real device offline installation have not been tested in this run.

## Daily feature checks

`node scripts/test-daily-sign.mjs` checks all 138 catalog entries, daily labels and media, external-reference fallbacks, and keyed player reset. From the repository root, `node --test scripts/daily-features.test.mjs` checks shared local-day scheduling (including DST), the homepage challenge bank, scoring, answer locking, and persistence.
