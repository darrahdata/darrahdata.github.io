# OCIA Prayer Companion

A standalone OCIA prayer companion at `/ocia/` for personal prayer and following along with a group on a phone. It is listed beside Ave Maria on the homepage; Ave Maria remains a separate app.

## Run

Serve the repository root with a static HTTP server, then open `/ocia/`. ES modules and the JSON library require HTTP rather than a `file:` URL. No build, backend, API keys, or participant accounts are needed.

## Included

- Fifteen full-text prayers, including both creeds, Grace Before Meals, the Guardian Angel Prayer, and the Prayer to St. Michael. The Fatima Prayer is recited by Everyone. Hail, Holy Queen and Collect After the Rosary match the user-supplied screenshots: Everyone recites the main prayer, followed by the printed Leader and Response lines. Other prayers are arranged for a leader and group response.
- The Prayers tab opens directly with Begin With Essentials and the prayer library. Find a Prayer appears inside the search field, with an accessible name for screen readers. The introductory slogan and question-and-answer section have been removed; instruction belongs with the OCIA leader.
- All twenty mysteries appear in their own section within Prayers, grouped into four sets with artwork thumbnails. The Mysteries of the Rosary introduction describes the twenty scenes contemplated during the Rosary; each set explains its name and states its usual prayer days. A brief note clarifies that these days are customary. Source links remain documented here. Mystery reading pages show the full numbered title, quoted Scripture with its verse reference, and artwork. The titles, quotations, and references are copied verbatim from Ave Maria’s scriptural mysteries in `rosary-v2/index.html`; no additional meditation or intention text appears. Mystery readers use a compact Lora heading and size the uncropped artwork to the remaining screen space. Small screens and enlarged text can still scroll to keep all content readable.
- Reading follows device/browser text sizing with no in-app voice or text-size controls. Prayer pages show a sage italic title, gold Leader labels, sage Response and Everyone labels, and quoted spoken words. Directions remain outside quotation marks; previous/next, contents, repetition counts, and saved reading position remain available.
- Phone layouts use larger touch controls, and adapt to landscape and enlarged text. In prayer and mystery readers, tap the right half of the reading area to advance or the left half to go back, including blank space around a short prayer. Existing Next, Previous, and Contents controls remain available. Page taps ignore scrolling, dragging, long presses, text selection, multiple fingers, controls, and open dialogs; the opening pane and completion screen use their buttons. Repeated prayers show a count such as “1 of 10” and one bead per repetition. The current bead glows gold, completed beads are sage, and remaining beads are outlined. Beads follow each consecutive prayer group, update on navigation and resume, and wrap for longer runs; the numeric count provides the accessible equivalent. Dialog Close buttons remain available while scrolling; the prayer picker opens without automatically showing a phone keyboard.
- Use Title Case for interface headings, categories, navigation, and control labels (for example, “Other Prayers”); preserve sentence formatting in prayer text and explanatory prose.
- A prayer set builder: add, reorder, adjust repetitions of each prayer or mystery, remove, save, and preview up to 32 pages total; up to 20 saved prayer sets per browser. Consecutive repeats appear as one group in the builder and as individual pages when reading or sharing. Repeat choices use the remaining page capacity, up to ×32 for a single group.
- Simple browsing: adding and organizing are available in My Prayers, behind Create Prayer Set. Saving prompts for an editable Prayer Set Name; new sets start with My Prayer Set, so a date does not need to be part of the name.
- Opening a prayer set QR code or shared link saves it in Saved Prayer Sets on that device, ready to reopen directly. Identical links do not create duplicate entries, and importing does not replace a draft. Full or unavailable browser storage is reported without blocking the prayer reader.
- Prayer sets can include an optional Created By name identifying the person who prepared the set. Newly created sets record an automatic Date Created value, shown read-only in the builder and save form. Saved sets, share dialogs, and a reader opening pane show Created By and Date Created on separate lines beneath the set name. The opening pane has a Begin Prayer button and does not count toward the set’s pages. Prayer and mystery pages omit these details. Last Updated is no longer displayed; existing update timestamps are retained in storage and shared links for compatibility. The stored update timestamp changes when the name, creator, prayer order, or repetition counts change; opening, loading, sharing, resuming, and saving without changes preserve it. Date Created remains unchanged. Legacy sets keep unknown dates absent, while subsequent edits record Last Updated without inventing a creation date. Existing names remain unchanged.
- Versioned prayer set links and locally generated QR codes; each participant advances independently. Saving opens the QR code immediately, and each saved set has a Share QR button. Codes can be downloaded as PNG images or printed, and prayer set links can be copied or shared.
- How to Use is the first tab and default start page, followed by Prayers, My Prayers, and The Mass. Mysteries live in their own subsection of Prayers. How to Use explains the three content tabs with matching icons and direct shortcuts: Prayers for individual prayers and mysteries, My Prayers for opening, creating, and sharing sets, and The Mass for following the ordered guide. It includes reading roles, Begin Prayer, tap-to-turn navigation, Next/Previous, Contents, repetitions, and automatic saving from shared links. Text-size instructions are omitted. Shared links still open the prayer reader immediately and save the set automatically; closing or finishing a shared set returns to My Prayers.
- Completion says Prayer Complete, with a plain singular/plural confirmation and Pray Again, Done, and Review Prayer Set actions.
- A four-section Mass guide uses the official names Introductory Rites, Liturgy of the Word, Liturgy of the Eucharist, and Concluding Rites. Its 25 open cards follow one continuous path from the user-supplied parish leaflet, without dropdowns or alternate-form controls. Timing badges identify regular parts and those used on certain days. Spoken leader cues and participant responses are quoted in distinct role colors; directions, including chest tapping, remain outside quotation marks.

## Mass Source and Scope

The spoken Mass text in `mass.mjs` comes from the user-supplied video of **St. Dominic’s Missal for The New Translation of The Mass**. The leaflet identifies excerpts from the English translation of *The Roman Missal*, © 2010 International Commission on English in the Liturgy Corporation, and compilation/layout © 2011 St. Dominic’s Catholic Church, San Francisco.

The app follows one printed form at each branch: the first greeting, I Confess followed by the English Kyrie, the Nicene Creed, the first Mystery of Faith acclamation (“We proclaim…”), the simple blessing, and “Go forth, the Mass is ended.” Communion shows the minister’s “The Body of Christ” and an Amen explicitly labeled for communicants only. Other options printed in the leaflet are not added to the interface.

The leaflet’s abbreviated priest prayers for deliverance and peace remain descriptive cues; their missing middle portions are not supplied from memory. Readings, the psalm response, the Collect, and other changing prayers are also described rather than invented. The Mass Our Father uses the leaflet’s wording without its devotional final Amen, followed by the printed doxology. The prayer-library version is unchanged. The Confiteor follows the leaflet, including its second “and you, my brothers and sisters,” with no Amen until the priest’s absolution.

Brief timing and posture notes help attendees follow the sequence. The usual conditions for Gloria, the Creed, the second reading, and the homily were checked against Catholic sources below; those notes are explanatory guidance rather than a claim that all of them were printed in this leaflet. This is a companion to the supplied parish leaflet, not every possible Mass form or the variable texts for a particular celebration.

Sources reviewed:

- USCCB Order of Mass: https://www.usccb.org/prayer-and-worship/the-mass/order-of-mass
- USCCB Universal Prayer (GIRM 69-71): https://www.usccb.org/prayer-and-worship/the-mass/order-of-mass/liturgy-of-the-word/universal-prayer
- USCCB publication guidelines (common Universal Prayer response): https://www.usccb.org/resources/guidelines-publication-liturgical-books.pdf
- USCCB GIRM chapter IV (assembly responses and their contexts): https://www.usccb.org/prayer-and-worship/the-mass/general-instruction-of-the-roman-missal/girm-chapter-4
- USCCB How to Pray the Rosary: https://www.usccb.org/how-to-pray-the-rosary
- ICEL copyright policies: https://www.icelweb.org/copyright.htm
- USCCB permissions guidance: https://www.usccb.org/committees/divine-worship/policies/copyright-permissions-requirements

## Sharing and Privacy

The URL fragment contains a version, prayer set name, ordered content IDs, an optional creator name, an optional creation date, and an optional update date. Automatic timestamps use canonical UTC ISO strings and display as local dates. Explicit calendar dates use `YYYY-MM-DD` and display that calendar day without timezone conversion. Existing three-field, four-field, and five-field links stay unchanged; updated dates use a sixth field with empty placeholders for absent earlier metadata. Existing `#class=` links, storage keys, and catalog IDs remain compatible despite the friendlier interface names. The link does not contain instructor credentials. No analytics are included. Anyone holding a link can read its contents and optional metadata; do not put private intentions in titles. Prayer set links are not secret storage.

Each shared URL is a snapshot of the title and order. Edits generate a different link and QR code. It is not a live room: participants do not automatically follow the instructor's page. Prayer wording is supplied by the app's catalog, so approved catalog corrections will apply to previously shared sets. Keep catalog IDs stable and add a new schema version for incompatible changes.

Drafts, saved prayer sets, and reading positions remain in this browser. They do not synchronize between devices; clearing browser data removes them. Clipboard and browser storage may be unavailable; the app provides manual fallbacks. QR links created on localhost cannot be scanned from another device. Publish the app at its final HTTPS address before sharing with a group.

## Tests

With Playwright available and a server on `127.0.0.1:8080`:

```sh
node --test ocia/core.test.mjs ocia/browser.test.cjs ocia/mobile.test.cjs ocia/import.test.cjs ocia/creator.test.cjs
OCIA_BROWSER=webkit node --test ocia/browser.test.cjs ocia/mobile.test.cjs ocia/import.test.cjs ocia/creator.test.cjs
```

`OCIA_URL` overrides the local URL. Chromium tests use installed Chrome. WebKit needs its Playwright browser installed.

The mobile tests use touch-enabled phone viewports, check the shared prayer set at 320–430px and in landscape, tap through ten repeated Hail Marys, rotate and reload, scroll long dialogs, and verify navigation with enlarged browser text. Legacy app text-size and voice preferences are ignored. They emulate browser layouts rather than physical phone keyboards or camera scanning.

## Third-Party Assets

- QR Code Generator 2.0.4 by Kazuhiko Arase, MIT: `vendor/qrcode.mjs` and `vendor/qrcode-LICENSE`.
- Lucide icons, ISC: `vendor/lucide.min.js` and `vendor/lucide-LICENSE`.
- Cormorant Garamond and Lora are loaded from Google Fonts with local serif fallbacks.
- Mystery artwork and the prayer snapshot are copied from the existing Ave Maria app. They are stored locally so the new app does not depend on the Rosary app's route or JavaScript.
