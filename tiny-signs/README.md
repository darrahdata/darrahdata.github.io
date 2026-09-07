# Tiny Signs

A beginner-friendly baby sign learning app for parents, before and after baby arrives.

- Start with Milk, More, and All done, then explore all 12 signs or choose a routine.
- Each sign has a human demonstration embedded from its publisher's YouTube video, replay, available playback speeds, and optional repeat.
- Watch → Copy → Use lessons explain both hands, palm direction, location, and movement.
- Four self-check cues give practice feedback. The optional camera mirror is local, never recorded or graded, and stops when the lesson is closed.
- Practice counts and signs modeled with baby are tracked separately in localStorage. Existing modeled counts are preserved.
- Video and thumbnails require internet access and load from YouTube. If embedding fails, a direct link to the same video and written cues remain available.

## Sources

Video IDs were found in the publishers' dictionary pages and their YouTube oEmbed titles checked on September 7, 2026. The source URL and credit are stored with each sign and linked in the player. ASL University supplies Milk, Mom, Dad, All done/Finish, and Hurt. Baby Sign Language supplies Sleep, Diaper, More, Up, Eat, Drink, and Help. Videos are embedded, not copied or rehosted. Human demonstrations retain their original orientation.

These are introductory vocabulary lessons, not a complete ASL course. Self-check feedback is not professional evaluation.

## Development

```sh
pnpm install
pnpm run dev
pnpm run build
```

GitHub Pages serves the tracked `index.html` and `assets/` files. After building, copy `dist/index.html` and generated `dist/assets/` files here before publishing.

## Verification

Production build and isolated React interaction checks passed for all 12 lesson routes, player replay/speed/repeat and teardown (mock YouTube API), self-checks, independent practice/model counts, local persistence, camera fallback and stream cleanup (mock media API), low-light settings, and library rendering. External oEmbed endpoints confirmed video titles; full browser playback was not tested.
