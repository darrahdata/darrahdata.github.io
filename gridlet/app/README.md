# Gridlet

A small native macOS window manager inspired by Divvy’s grid interaction.

## Run

Open `dist/Gridlet.app`. Click **Accessibility…**, add Gridlet to System Settings → Privacy & Security → Accessibility, and enable it. Focus the window you want to arrange, then click Gridlet’s grid icon in the menu bar. Drag across the 6 × 6 grid or choose a preset. Use the Display menu to move the window to another monitor. Undo restores the last window’s position and size.

Press **Command–Shift–D** from any app to show the grid centered on the active window’s display, then drag to place the window. Press the shortcut again to hide the grid. Gridlet must be running. If another app has already registered the shortcut, Gridlet displays a warning and remains available from the menu bar.

## Build

Run `zsh build.sh` with Apple’s Swift command-line tools installed. The local app is ad-hoc signed, not notarized for distribution. Rebuilding may require granting Accessibility permission again.

## Limits

Some apps enforce minimum window dimensions or don’t support Accessibility resizing. Exit macOS full-screen mode before arranging a window. This version has no launch-at-login setting or saved custom layouts. No network connections or third-party dependencies.
