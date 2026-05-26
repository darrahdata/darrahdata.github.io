# The Rosary — A Contemplative Companion

A minimal, browser-based app for praying the rosary. No installation, no account, no ads — just the prayers.

**Live site:** [darrahdata.github.io](https://darrahdata.github.io)

---

## What it does

Guides you through a full rosary decade-by-decade with the complete traditional prayer texts. You choose the mystery set and how you want to advance through the beads.

**Mystery sets**
- Joyful (Monday, Saturday)
- Sorrowful (Tuesday, Friday)
- Glorious (Wednesday, Sunday)
- Luminous (Thursday)

**Bead advancement**
- **Tap** — tap/click to move to the next prayer
- **Voice** — uses your microphone via the Web Speech API; the app advances automatically when it detects you speaking, so you never have to touch the screen

**Prayers included**
Apostles' Creed, Our Father, Hail Mary, Glory Be, Fatima Prayer, Hail Holy Queen — all five decades with the corresponding mystery meditations.

---

## How to use

1. Open [darrahdata.github.io](https://darrahdata.github.io) in any modern browser
2. Select a mystery set
3. Choose tap or voice mode
4. Pray

For voice mode, grant microphone access when prompted. The app does not record or transmit audio — recognition runs entirely in the browser.

---

## Stack

Plain HTML, CSS, and JavaScript. No framework, no build step. The Web Speech API handles voice recognition where supported (Chrome/Edge work best).

---

## Contributing

Issues and pull requests welcome. Keep it simple — the goal is a distraction-free prayer tool.
