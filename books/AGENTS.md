# Bookmarked Design Contract

This app is part of darrahdata.github.io, not a separate visual brand. Before future UI work, read this file, the current page, style.css, and the parent homepage. Preserve unrelated work.

- Keep the existing dark, quiet library aesthetic: charcoal surfaces, restrained antique gold accents, soft paper-colored text, muted green and blue supporting tones.
- Reuse the variables in style.css. Do not introduce unrelated palettes, decorative backgrounds, or a different component language.
- Cormorant Garamond is for headings; EB Garamond is for reading and summaries; system sans-serif is for controls and metadata. Letter spacing stays zero.
- Covers are the primary imagery. Use verified real book covers, preserve their proportions, and provide a clean title/author fallback if unavailable. Do not invent cover artwork.
- The bookshelf is the first screen, not a promotional landing page. Keep useful information and actions visible, with responsive grids and no horizontal page overflow.
- Use existing Lucide icons and accessible button names, with generous touch targets. Repeated cards and dialogs have a maximum 8px corner radius. Avoid nested decorative cards.
- Preserve manual progress, status, original summaries, editable notes, local-only storage, backups, and duplicate-safe manual Kindle imports. Do not imply cloud or automatic Kindle sync.
- Never commit user-imported highlights, backups, or personal notes. Curated summaries are original descriptions, not excerpts.
- Validate storage and import changes with core tests; check selectors and script syntax. Preserve readable contrast, reduced motion support, focus visibility, and accessible dialogs.
- Keep additions scoped to this app unless a user explicitly requests a hub-wide change.
