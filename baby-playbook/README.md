# Baby Playbook

A static Catholic family companion at https://darrahdata.github.io/baby-playbook/.

- Today chooses reminders from a saved due/birth date. A due date never automatically becomes a birth date.
- The Guide retains 274 reference cards. Targeted corrections to 49 care cards include exact primary sources and source-check dates; this is not a comprehensive clinical review.
- Faith adds 18 Catholic and character practices plus Baptism, Mass, and family checklists. Toddler practices remain separate from newborn care; prayer and saint stories continue through later stages.
- Handoff, emergency contacts, favorites, profile, display preference, and checklists use the `baby-playbook-family-v1` localStorage key. They do not upload or sync. Copying a handoff and printing a card are explicit user actions. Browser storage failure is displayed and never reported as a successful save.
- The service worker caches only this app's static assets, with its own scope and cache prefix. External sources and Tiny Signs have separate connectivity requirements. Close/reopen the app to activate a downloaded update.

## Files and deployment

No build step or package installation is needed. `index.html`, `styles.css`, `app.js`, `core.mjs`, `data.js`, and `faith.js` are the application. GitHub Pages publishes the repository root from `main`. Preserve row IDs when changing titles so favorites continue to work. Bump the cache version in `sw.js` whenever public assets change.

## Checks

Run `node --test baby-playbook/review.test.mjs` from the repository root. Tests cover age boundaries and invalid dates, persistence and denied storage, search synonyms, preserved content and corrected contradictions, faith-stage selection, escaping, all route render functions, form persistence/print content, and scoped offline cache behavior. HTTP checks verify every shell asset is served.

Validation uses a JavaScript view/event harness and service-worker mocks. Browser UI, actual phone installation/offline behavior, and printed page layout were not exercised in this update. No private family details are included in the source.
