# Tiny Signs

Tiny Signs is a newborn-first visual coach for a small set of useful ASL vocabulary. It helps a parent break each sign into handshape, palm direction, body location, and movement; compare in a private on-device mirror; and build a consistent modeling habit during real routines.

The animated diagrams are memory aids. Each lesson links to a real demonstration from ASL University for exact form and natural timing. The app does not record camera video or claim to grade a sign automatically.

## Local development

```bash
pnpm install
pnpm run dev
```

## Production build

```bash
pnpm run build
```

GitHub Pages serves the tracked `index.html` and `assets/` files in this directory. After building, copy `dist/index.html` and the generated `dist/assets/` files here before committing.
