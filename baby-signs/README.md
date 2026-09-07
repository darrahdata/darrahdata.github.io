# Baby Signs

A companion page to [Little Signs](../little-signs), built for a parent who knows
no sign language at all. Little Signs tells you *which* signs to learn; Baby Signs
shows you **what to actually do with your hands and arms**.

Live at `/baby-signs/`.

## What it does

- **Animated hands.** Every sign is drawn as an articulated hand — each finger is a
  three-bone chain that bends at real joints and foreshortens as it curls, so a fist
  reads as a fist and a pinch reads as a pinch.
- **Arms, not just hands.** A forearm is drawn behind the hand and the elbow rises
  with it, so movements that depend on arm travel (help, thank you, grandma) are legible.
- **A body to aim at.** A faint head and torso sit behind the hands, and a pulsing
  target ring marks the spot the sign lands on — chin for Mom, forehead for Dad.
- **Steps that follow along.** The numbered steps highlight in time with the animation.
- **Slow-motion** for anything that moves too fast to copy.
- **Mirror mode.** Opens the front camera beside a small looping demo so you can check
  yourself. The video is never recorded, stored, or transmitted — it stays in the page.
- **Quiz mode**, a sign of the day, search, categories, and progress saved to
  `localStorage`.

## The 27 signs

Feeding · milk, more, eat, drink, water, all done
Sleep & care · sleep, bath, diaper, hurt, help
Manners & feelings · please, thank you, I love you, sorry, yes, no
People · mom, dad, grandma, grandpa
Play & world · play, book, ball, dog, cat, light

## How the animation works

Each sign is a small keyframe track:

```js
k:[[t, pose, x, y, rotation], ...]
```

`t` runs 0 → 1 and loops. Poses are handshapes defined as per-digit curl values
(`[thumb, index, middle, ring, pinky]`) plus spread and convergence. The renderer
interpolates between keyframes on `requestAnimationFrame` and writes SVG transforms,
so adding a sign means adding data, not code. The loop idles whenever no sheet is
open, to stay easy on a phone battery.

## Technical notes

- One static `index.html`. No build step, no dependencies, no framework.
- Works on GitHub Pages as-is.
- Mobile-first; tested from 320px up.

## An honest note on ASL

These signs come from American Sign Language, a full language with its own grammar,
culture, and regional variation. This page is a friendly on-ramp for a parent — not a
substitute for learning from Deaf educators. Signs vary by region and by family, and
that is fine. Say the word out loud every time you sign it.
