#!/bin/zsh
set -eu
cd "$(dirname "$0")"
APP="$PWD/dist/Gridlet.app"
mkdir -p "$APP/Contents/MacOS"
mkdir -p "$PWD/dist/build"
for ARCH in arm64 x86_64; do
  swiftc -O -target "$ARCH-apple-macosx13.0" Sources/main.swift -o "$PWD/dist/build/Gridlet-$ARCH" -framework AppKit -framework SwiftUI -framework ApplicationServices -framework Carbon
done
lipo -create "$PWD/dist/build/Gridlet-arm64" "$PWD/dist/build/Gridlet-x86_64" -output "$APP/Contents/MacOS/Gridlet"
cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>Gridlet</string>
<key>CFBundleIdentifier</key><string>local.darrahdata.gridlet</string>
<key>CFBundleName</key><string>Gridlet</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>0.3.0</string>
<key>CFBundleVersion</key><string>3</string>
<key>LSMinimumSystemVersion</key><string>13.0</string>
<key>LSUIElement</key><true/>
<key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
codesign --force --sign - "$APP"
echo "Built $APP"
