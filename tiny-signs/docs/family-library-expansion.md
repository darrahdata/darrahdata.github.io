# Family library expansion

138 vocabulary entries: 135 native ASL Signbank clips, plus three linked ASL University teaching references (Jesus, Bible, Amen). Twelve overlapping collections organize everyday life, church, care, food, feelings, movement, family, and outings. This is a broad family vocabulary companion, not an exhaustive ASL dictionary or a complete language course.

## Teaching and source review

- Every additional native MP4 decoded successfully. Eight frames per clip were inspected for public teal-background media and movement/cue alignment; ambiguous details received larger frame inspection.
- Each native entry retains the exact source ID, source variant label, watermarked source image, license, and attribution. Media files are unmodified.
- Independent review by a qualified Deaf ASL educator is still outstanding. No sign is labeled expert-reviewed.
- Religious vocabulary requires community/context review. Cross is a vocabulary item, separate from a devotional gesture. Individual English word prompts do not translate an entire prayer into ASL.
- Jesus, Bible, and Amen demonstrations remain on the creators’ site. They are not copied or embedded. Recognition practice excludes them; word-prompt practice supports the external reference flow.
- New written cues are original practice summaries tied to the selected variant. Some closely related forms (Sing/Music, Gentle/Soft) are explained in lesson notes.

## App behavior

- Favorites persist in the existing device-local settings record. Existing practice and modeled counts retain their keys.
- Collection routes can be shared, for example `#/signs/church` and `#/practice/church`.
- Search includes useful synonyms. Favorites and practiced/unpracticed filters narrow the library.
- Offline packs can be saved by collection. Previously downloaded files are reused across collections. The full native pack is approximately 127 MB; starter packs are much smaller.
- External references require internet access. Cache storage is device-local and can be evicted by the browser.

## Validation

Production build; all 138 lesson routes rendered in React/jsdom; all 135 native media files and posters present; favorite persistence; church membership; collection and saved-sign recall; recognition concealment; search aliases; native playback controls; camera cleanup; unavailable offline storage. Service-worker tests cover scope, cache cleanup, range requests, navigation fallback, full/subset pack downloads, reuse, removal, and cancellation.

These automated checks and media inspections do not replace independent ASL review or real-device browser/offline testing.
