# Mobile regression checks

The plain HTML apps share `assets/mobile.css` for touch targets, form sizing,
focus outlines, and Safari select rendering. App-specific layout rules live in
each app's `mobile.css`. Tiny Signs imports the shared layer into its Vite bundle;
rebuild its deployed assets and service worker whenever that layer changes.

Start a static server at the repository root:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

With Node, Playwright, Chrome, and Playwright's WebKit engine available:

```sh
node --test scripts/mobile.test.cjs
MOBILE_BROWSER=webkit node --test scripts/mobile.test.cjs
node --test scripts/all-apps.test.cjs scripts/home.test.cjs rosary-v2/mobile.test.cjs rosary-v2/runtime.test.cjs rosary-analytics/review.test.cjs baby-playbook/review.test.mjs books/core.test.cjs
```

The mobile suite checks 35 screens at widths 320, 360, 390, 430, 768, 844
(landscape), and 1440. It checks page overflow, touch targets, input font sizes,
runtime errors, and representative touch/navigation/save flows. Screenshots are
written to `/tmp/site-mobile-review`. `MOBILE_TEST_URL` can override the local URL.

Tests use isolated browser contexts and mock Model Usage records. They do not
alter real saved prayers, family details, or reading notes. For Nora coverage is
limited to the public password gate, not the encrypted app. Browser emulation
does not replace a final check on physical iPhone and Android devices, including
their keyboards, safe areas, and installed-app behavior.
