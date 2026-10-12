# OCIA: Prayer & Learning

A standalone OCIA classroom app at `/ocia/`, listed beside Ave Maria on the homepage. Ave Maria remains a separate app.

## Run

Serve the repository root with a static HTTP server, then open `/ocia/`. ES modules and the JSON library require HTTP rather than a `file:` URL. No build, backend, API keys, or participant accounts are needed.

## Included

- Fourteen full-text prayers: the Sign of the Cross, the user-supplied Fatima Prayer, and twelve copied unchanged from the existing Ave Maria library, including both creeds, Grace Before Meals, the Guardian Angel Prayer, and the Prayer to St. Michael.
- All twenty mysteries, grouped into four sets, with existing devotional artwork and meditations.
- Read-aloud using available device voices; adjustable text; visible previous/next; contents; saved reading position.
- A class builder: add, reorder, adjust repetitions of each prayer or mystery, remove, save, and preview up to 32 pages total; up to 20 saved sets per browser. Consecutive repeats appear as one group in the builder and as individual pages when reading or sharing. Repeat choices use the remaining page capacity, up to ×32 for a single group.
- Student-first browsing: adding and organizing are available only in My Class, behind Prepare a class. Saving prompts for an editable set name; new sets default to the local date.
- Versioned class links and locally generated QR codes; each participant advances independently.
- A four-section Mass guide with sections collapsed by default, selected alternatives, inline prayer texts, and brief assembly responses. Form A includes user-supplied I confess wording. The Universal Prayer includes its common response, not invented petitions. Longer missing forms are marked explicitly.

## Content Review Still Required

**The Mass section is not a complete response library or approved worship aid.** It does not include every spoken response, the full range of rubrics, or texts for special celebrations. Do not advertise complete coverage.

Before expanding the response library, obtain a parish-approved text source, establish the appropriate digital reproduction permissions, and have the OCIA leader or parish liturgist review the wording and contexts. Missing full forms remain labeled instead of supplying unlicensed or guessed text. The I confess wording and its “Tap your chest” cue were supplied by the user. Neither this wording nor existing prayer wording copied from Ave Maria is a new claim of liturgical approval or permission. The Mass presentation of the Our Father omits its devotional final Amen; the library version is unchanged.

Sources reviewed:

- USCCB Order of Mass: https://www.usccb.org/prayer-and-worship/the-mass/order-of-mass
- USCCB Universal Prayer (GIRM 69-71): https://www.usccb.org/prayer-and-worship/the-mass/order-of-mass/liturgy-of-the-word/universal-prayer
- USCCB publication guidelines (common Universal Prayer response): https://www.usccb.org/resources/guidelines-publication-liturgical-books.pdf
- USCCB GIRM chapter IV (assembly responses and their contexts): https://www.usccb.org/prayer-and-worship/the-mass/general-instruction-of-the-roman-missal/girm-chapter-4
- USCCB How to Pray the Rosary: https://www.usccb.org/how-to-pray-the-rosary
- ICEL copyright policies: https://www.icelweb.org/copyright.htm
- USCCB permissions guidance: https://www.usccb.org/committees/divine-worship/policies/copyright-permissions-requirements

## Sharing and Privacy

The URL fragment contains a version, class title, and ordered content IDs. It does not contain instructor credentials. No analytics are included. Anyone holding a link can read its contents; do not put private names or intentions in titles. Class links are not secret storage.

Each shared URL is a snapshot of the title and order. Edits generate a different link and QR code. It is not a live room: participants do not automatically follow the instructor's page. Prayer wording is supplied by the app's catalog, so approved catalog corrections will apply to previously shared sets. Keep catalog IDs stable and add a new schema version for incompatible changes.

Drafts, saved sets, and reading positions remain in this browser. They do not synchronize between devices; clearing browser data removes them. Clipboard, device voices, and browser storage may be unavailable; the app provides manual fallbacks. QR links created on localhost cannot be scanned from another device. Publish the app at its final HTTPS address before sharing with class.

## Tests

With Playwright available and a server on `127.0.0.1:8080`:

```sh
node --test ocia/core.test.mjs ocia/browser.test.cjs
OCIA_BROWSER=webkit node --test ocia/browser.test.cjs
```

`OCIA_URL` overrides the local URL. Chromium tests use installed Chrome. WebKit needs its Playwright browser installed.

## Third-Party Assets

- QR Code Generator 2.0.4 by Kazuhiko Arase, MIT: `vendor/qrcode.mjs` and `vendor/qrcode-LICENSE`.
- Lucide icons, ISC: `vendor/lucide.min.js` and `vendor/lucide-LICENSE`.
- Cormorant Garamond and Lora are loaded from Google Fonts with local serif fallbacks.
- Mystery artwork and the prayer snapshot are copied from the existing Ave Maria app. They are stored locally so the new app does not depend on the Rosary app's route or JavaScript.
