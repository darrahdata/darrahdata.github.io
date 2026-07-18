# Little Signs

Little Signs is a mobile-first companion app for expecting and new parents who want to learn baby sign language and beginner ASL through daily routines, short practice sessions, and personalized vocabulary.

## What is included

- Vite React app
- GitHub Pages-ready static build
- HashRouter routing for refresh-safe navigation
- Local storage progress tracking
- Onboarding
- Today screen
- Learn library
- Parent-guided sign lessons with hand setup, movement, mistakes, and coaching
- Animated motion controls with slow, normal, repeat, and step-by-step modes
- Tappable self-checks and local confidence tracking
- Optional local-only camera mirror with a no-camera fallback
- Teach-before-confidence practice sessions
- Routine lessons with spoken and signed coaching prompts
- Custom word list
- Progress dashboard
- GitHub Actions deployment workflow

## Important ASL note

This app is designed as a parent learning companion. ASL is a full language with its own grammar, culture, and regional variation. Written sign notes and placeholder videos are not a substitute for verified ASL resources or learning from Deaf educators.

Most sample signs in this MVP are marked `needs video source` or `regional variation possible` until you add verified video content.

## Local setup

```bash
pnpm install
pnpm run dev
```

Open the local URL shown by Vite.

## Build

```bash
pnpm run build
pnpm run preview
```

The production build is created in the `dist` folder.

## GitHub Pages setup

### 1. Set the Vite base path

Open `vite.config.js` and update this line:

```js
const githubPagesBase = "/little-signs/";
```

If your repo is:

```text
https://github.com/USERNAME/little-signs
```

use:

```js
const githubPagesBase = "/little-signs/";
```

If your site is a root user site:

```text
https://USERNAME.github.io
```

use:

```js
const githubPagesBase = "/";
```

### 2. Enable GitHub Pages

In your GitHub repository:

1. Go to Settings
2. Go to Pages
3. Under Build and deployment, choose GitHub Actions
4. Push to `main`

The included workflow in `.github/workflows/deploy.yml` will build and deploy the app.

## File structure

```text
src/
  components/
  data/
  utils/
  App.jsx
  main.jsx
  styles.css
public/
  icons/
  videos/
```

## Expanding the app

Best next upgrades:

1. Add verified ASL videos or GIFs for each sign
2. Add text-to-speech for listening practice
3. Add camera-based mirror practice prompts
4. Add reminders for routines
5. Add a parent notes section for each sign
```
