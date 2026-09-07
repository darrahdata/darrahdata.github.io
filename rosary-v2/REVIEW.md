# Rosary product review

Prepared September 7, 2026. Local review only; no commit, push, deployment, database change, or production analytics change.

## Preview

- Prayer companion: http://127.0.0.1:8080/rosary-v2/
- Analytics interface: http://127.0.0.1:8080/rosary-analytics/?demo=1
- Analytics preview numbers are explicitly labeled sample data, not actual usage.

## Diagnosis

The app already supports a substantial devotional library, local sacred art, day-based mystery selection, communal responses, read aloud, and compact mobile navigation. The green low-light palette and devotional typography are worth keeping.

The most consequential gaps were a saved session with no resume path, ambiguous names for adapted prayer forms, a dated parish announcement in a general-purpose prayer flow, incomplete menu focus management, and analytics labels that overstated what aggregated counts measure. The first-time experience also assumed familiarity with decades and leader/response prayers.

## Staged recommendations

1. **Return to prayer.** Resume the saved prayer, chaplet, common prayer, or mystery study after a reload or exit. Validate saved data and tolerate unavailable storage. Migrate saved positions when adding the traditional opening prayer. Resume does not record another start event.
2. **A calmer reading surface.** Keep the current palette and images, simplify setup into unframed sections, strengthen small-text contrast, remove exaggerated letter spacing, and provide three prayer-text sizes that persist on the device.
3. **An optional introduction.** Explain mysteries, decades, and leader/response in a short expandable section. Link to the USCCB guide. Provide optional visible Previous/Next controls for learners while retaining side tapping and the dock by default.
4. **Clear prayer forms.** Label the adapted ten-Hail-Mary flow as a short form and explain how it distributes prayers across all five mysteries. Describe the family form accurately. Preserve its current shortened structure rather than reverting to older conversation versions.
5. **Private intentions.** Offer an optional typed intention, Continue, and Skip. Save drafts with the local session, escape their display, and keep intentions out of analytics. Completion removes the stored session.
6. **Reliable navigation.** Keep buttons and text inputs outside side-tap navigation; treat dragging and scrolling as reading. Allow vertical arrow keys to scroll. Trap menu focus, restore it when closing, and recover correctly across the desktop breakpoint.
7. **Read-aloud corrections.** Ignore stale speech callbacks, stop audio state on exit, and honor the family opening's threefold Hail Mary in audio.
8. **Specific flow corrections.** Use the existing Sign of the Cross text at the beginning and end of the short and five-decade forms. Limit First Saturday content to the first Saturday, preserve that choice across resume, and remove the obsolete statue/Adoration announcement. Prayer definitions themselves have not been rewritten.
9. **Honest analytics.** Clarify visitor-days and separate start/completion events, add period and freshness context, improve empty/error/loading states, protect against out-of-order requests, and make charts keyboard accessible with tabular values.
10. **Clean preview traffic.** Suppress collection on localhost, loopback, and file previews. Existing production opt-out and Global Privacy Control remain in place.

## Analytics: what to do next

The authenticated live dashboard requires its password; no actual usage totals were available during this review. These recommendations are based on the client, Worker, schema, and sample interface, not an inference about the current audience.

- Use current counts to compare recorded prayer-form, mystery, chaplet, and study activity. Treat same-person visits on different days as separate visitor-days. Today's partial counts should not be compared directly with a full day.
- Add a prior-period comparison for completed days. This can answer whether recorded usage is rising without adding new personal data.
- To evaluate interruption recovery, consider narrowly defined resume events. A session-linked completion funnel would require explicit instrumentation; the current ratio of totals is not a completion rate.
- To assess morning versus evening use, consider coarse time-of-day aggregates only if that question will guide a product decision. Existing daily totals cannot establish nightly prayer habits.
- If an OCIA pilot is approved, measure voluntary use of the introduction and navigation preferences without labeling people as Catholic, converts, or course participants. Observe a small facilitated session to learn what the counts cannot explain.
- Never collect intentions, prayer text, microphone audio, or identifiable spiritual histories. Do not equate time on page, completion events, or streaks with the quality of someone's prayer.

No new event categories, collection fields, or backend migrations are included in this preview.

## Validation

- Runtime regression tests cover all prayer modes, saved-session validation and migration, blocked storage, local analytics suppression, intention handling, speech callback cleanup, menu focus and resize recovery, First Saturday behavior, and traditional opening/closing prayers.
- Responsive browser checks cover 320, 360, 390, 430, 768, and 1280 pixels, extra-large text, reload/resume, center and side taps, visible fallback controls, menu navigation, common prayer selection, long-prayer clearance above the dock, completion, and restart.
- Analytics tests cover responsive layout, accessible chart values, date ranges, no-data states, failed refreshes, request races, and expired authentication.
- Both inline scripts parse; all 20 referenced devotional image paths resolve locally.
- Production dashboard authentication, physical-device speech output, VoiceOver/TalkBack, and actual parish teaching use still need hands-on review. Automated checks do not certify those experiences.

Run a static server from the repo root with `python3 -m http.server 8080 --bind 127.0.0.1`. With Node and Playwright available, run `node --test rosary-v2/runtime.test.cjs rosary-v2/mobile.test.cjs rosary-analytics/review.test.cjs`. Set `PLAYWRIGHT_CHROME_CHANNEL=chrome` to use an installed Chrome. This app itself needs no build step or added production dependency.

## Before OCIA use

Have a catechist review the traditional and custom forms with this preview, especially the distinction between the family adaptation and a traditional decade. Source-check the brief common-prayer versions, communal response conventions, and the attributed completion quotation before presenting the entire collection as an approved teaching resource. Then observe first-time users beginning prayer, finding audio, changing pages, and recovering after an interruption on real phones.

The 37 MB image library is lazy-loaded rather than downloaded as one bundle. A later pass could create smaller mobile image derivatives and design intentional offline availability; neither is necessary to publish this focused review, and neither is silently introduced here.

## Reference

[USCCB: How to Pray the Rosary](https://www.usccb.org/how-to-pray-the-rosary) supports the beginner definitions and the traditional Sign of the Cross / five-decade sequence. The existing family form remains explicitly a custom adaptation.

## Homepage recommendation

Reviewed the live darrahdata homepage on September 7. The recommendations below are now implemented in the staged local homepage preview; nothing has been committed or published.

- Keep the elegant darrahdata wordmark and shorten the introduction. The current desktop layout places the first projects roughly 540 pixels down the page.
- Feature real app screenshots so visitors understand the work before reading feature lists. Give Rosary and the primary family app the clearest emphasis; use compact entries for the remaining tools.
- Group the collection into Prayer, Family, and Data. Explain the difference between Little Signs, Baby Signs, and Tiny Signs, or eventually consolidate the entry points if they serve the same audience.
- Preserve a restrained dark identity with brighter body copy, neutral charcoal surfaces, and limited gold plus app-specific accents. Reduce the background grid and replace widely spaced small labels with more readable type.
- Replace generic Explore links with specific actions such as Open Rosary and Open Little Signs. Update the Rosary description, which still advertises voice follow-along and an older theme name.
- Move private analytics to a discreet owner link in the footer. Keep the public collection focused on what visitors can use.

Recommended direction: a compact, personal collection of useful apps, with the apps themselves providing the imagery and personality.

Homepage implementation uses a static HTML catalog and a small stylesheet, with three local screenshots of the actual apps. No runtime JavaScript, production dependencies, or new tracking was added. Public app routes, social links, and privacy access are preserved. Private analytics is now a clearly labeled footer link.

Homepage checks: 320, 360, 390, 430, 768, and 1280px layouts; loaded images; no horizontal overflow; 44px link targets; keyboard skip link; category navigation; and successful local app routes. Run `node --test scripts/home.test.cjs`. Screenshots can be refreshed against the local server with `node scripts/capture-home-previews.cjs`.
