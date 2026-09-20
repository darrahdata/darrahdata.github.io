import AppKit
import SwiftUI
import ApplicationServices
import Carbon

final class Model: ObservableObject {
    @Published var message = "Choose a window, then open Gridlet."
    @Published var appName = "No app selected"
    @Published var windowTitle = "Click a window to select it."
    @Published var appIcon: NSImage?
    @Published var trusted = false
    @Published var canArrange = false
    @Published var canUndo = false
    @Published var display = 0
    @Published var screens = NSScreen.screens
    @Published var shortcutStatus = "⌘⇧D · Show or hide grid"
    var closeGrid: (() -> Void)?
    var target: AXUIElement?
    var previous: (AXUIElement, CGPoint, CGSize)?
    var lastApplication: NSRunningApplication?
    var selecting = false

    func capture() {
        guard !selecting else { return }
        screens = NSScreen.screens
        display = min(display, max(0, screens.count - 1))
        if let frontmost = NSWorkspace.shared.frontmostApplication,
           frontmost.processIdentifier != ProcessInfo.processInfo.processIdentifier {
            lastApplication = frontmost
        }
        let oldTarget = target
        let wasTrusted = trusted
        trusted = AXIsProcessTrusted()
        guard let app = lastApplication, !app.isTerminated else {
            target = nil; canArrange = false
            appName = "No app selected"; appIcon = nil
            windowTitle = "Click a window to select it."
            return
        }
        appName = app.localizedName ?? "Selected app"
        appIcon = app.icon
        guard trusted else {
            target = nil; canArrange = false
            windowTitle = "Window title needs Accessibility access"
            message = "Resizing is locked until Accessibility is enabled."
            return
        }
        var value: CFTypeRef?
        let element = AXUIElementCreateApplication(app.processIdentifier)
        AXUIElementSetMessagingTimeout(element, 0.3)
        var result = AXUIElementCopyAttributeValue(element, kAXFocusedWindowAttribute as CFString, &value)
        if result != .success {
            result = AXUIElementCopyAttributeValue(element, kAXMainWindowAttribute as CFString, &value)
        }
        guard result == .success,
              let value, CFGetTypeID(value) == AXUIElementGetTypeID() else {
            target = nil; canArrange = false
            windowTitle = "No window selected"
            message = app.bundleIdentifier == "com.apple.finder" ? "Open a Finder window; the desktop cannot be resized." : "Click a standard window in \(appName)."
            return
        }
        target = (value as! AXUIElement)
        guard let target else { return }
        AXUIElementSetMessagingTimeout(target, 0.3)
        var title: CFTypeRef?
        _ = AXUIElementCopyAttributeValue(target, kAXTitleAttribute as CFString, &title)
        windowTitle = (title as? String).flatMap { $0.isEmpty ? nil : $0 } ?? "Untitled window"
        var fullScreen: CFTypeRef?
        _ = AXUIElementCopyAttributeValue(target, "AXFullScreen" as CFString, &fullScreen)
        if (fullScreen as? Bool) == true {
            canArrange = false
            message = "Exit macOS full-screen mode to arrange this window."
            return
        }
        var movable = DarwinBoolean(false); var resizable = DarwinBoolean(false)
        let moveCheck = AXUIElementIsAttributeSettable(target, kAXPositionAttribute as CFString, &movable)
        let sizeCheck = AXUIElementIsAttributeSettable(target, kAXSizeAttribute as CFString, &resizable)
        if (moveCheck == .success && !movable.boolValue) || (sizeCheck == .success && !resizable.boolValue) {
            canArrange = false
            message = "This window does not support moving and resizing."
            return
        }
        let changed = oldTarget.map { !CFEqual($0, target) } ?? true
        let newlyReady = !canArrange || !wasTrusted
        canArrange = true
        if changed || newlyReady { message = "Drag across the grid to arrange this window." }
        if changed, let frame = frame(target) {
            let top = screens.first?.frame.maxY ?? 0
            let cocoa = CGRect(x: frame.0.x, y: top - frame.0.y - frame.1.height, width: frame.1.width, height: frame.1.height)
            display = screens.indices.max(by: { area(screens[$0].frame.intersection(cocoa)) < area(screens[$1].frame.intersection(cocoa)) }) ?? 0
        }
    }
    func area(_ rect: CGRect) -> CGFloat { rect.isNull ? 0 : rect.width * rect.height }
    func frame(_ window: AXUIElement) -> (CGPoint, CGSize)? {
        var p: CFTypeRef?; var s: CFTypeRef?
        guard AXUIElementCopyAttributeValue(window, kAXPositionAttribute as CFString, &p) == .success,
              AXUIElementCopyAttributeValue(window, kAXSizeAttribute as CFString, &s) == .success,
              let p, let s, CFGetTypeID(p) == AXValueGetTypeID(), CFGetTypeID(s) == AXValueGetTypeID() else { return nil }
        var point = CGPoint.zero; var size = CGSize.zero
        guard AXValueGetValue(p as! AXValue, .cgPoint, &point), AXValueGetValue(s as! AXValue, .cgSize, &size) else { return nil }
        return (point, size)
    }
    func apply(_ rect: CGRect) {
        guard AXIsProcessTrusted() else { capture(); message = "Resizing is locked until Accessibility is enabled."; return }
        guard canArrange, let target, screens.indices.contains(display) else { message = "Click a movable window first."; return }
        if let f = frame(target) { previous = (target, f.0, f.1); canUndo = true }
        let screen = screens[display].visibleFrame
        let top = screens.first?.frame.maxY ?? 0
        let point = CGPoint(x: screen.minX + rect.minX * screen.width, y: top - screen.maxY + rect.minY * screen.height)
        let size = CGSize(width: screen.width * rect.width, height: screen.height * rect.height)
        set(target, point, size)
    }
    func set(_ window: AXUIElement, _ point: CGPoint, _ size: CGSize) {
        var point = point; var size = size
        let p = AXValueCreate(.cgPoint, &point)!; let s = AXValueCreate(.cgSize, &size)!
        _ = AXUIElementSetAttributeValue(window, kAXSizeAttribute as CFString, s)
        let moved = AXUIElementSetAttributeValue(window, kAXPositionAttribute as CFString, p)
        let resized = AXUIElementSetAttributeValue(window, kAXSizeAttribute as CFString, s)
        if moved != .success || resized != .success {
            if moved == .apiDisabled || resized == .apiDisabled {
                trusted = false; canArrange = false
                message = "macOS denied access. Enable this copy of Gridlet in Accessibility."
            } else {
                message = "\(appName) could not apply this layout (\(moved.rawValue), \(resized.rawValue)). Try selecting the window again."
            }
            return
        }
        message = "Applying layout…"
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [weak self] in
            guard let self, let current = self.target, CFEqual(current, window) else { return }
            guard let actual = self.frame(window) else {
                self.message = "Layout sent, but the window could not be checked."
                return
            }
            if abs(actual.0.x - point.x) > 3 || abs(actual.0.y - point.y) > 3 || abs(actual.1.width - size.width) > 3 || abs(actual.1.height - size.height) > 3 {
                self.message = "\(self.appName) adjusted the layout to its window size or position limits."
            } else { self.message = "Arranged \(self.appName) · \(Int(actual.1.width)) × \(Int(actual.1.height))" }
        }
    }
    func undo() { if let old = previous { set(old.0, old.1, old.2); previous = nil; canUndo = false } }
    func permissions() {
        let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true] as CFDictionary
        _ = AXIsProcessTrustedWithOptions(options)
        NSWorkspace.shared.open(URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")!)
    }
}

// AppKit delivers the very first drag even when this floating panel is inactive.
struct SelectionGrid: NSViewRepresentable {
    @ObservedObject var model: Model
    func makeNSView(context: Context) -> SelectionGridView { SelectionGridView(model: model) }
    func updateNSView(_ view: SelectionGridView, context: Context) { view.needsDisplay = true }
}

final class SelectionGridView: NSView {
    let model: Model
    var first: CGPoint?
    var last: CGPoint?
    override var isFlipped: Bool { true }
    override var mouseDownCanMoveWindow: Bool { false }
    override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }
    init(model: Model) {
        self.model = model
        super.init(frame: .zero)
        setAccessibilityElement(true)
        setAccessibilityLabel("Six by six layout grid. Drag a region to arrange the selected window, or use the preset buttons.")
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }
    func cell(_ event: NSEvent) -> CGPoint {
        let point = convert(event.locationInWindow, from: nil)
        return CGPoint(x: min(5, max(0, floor(point.x / max(1, bounds.width / 6)))), y: min(5, max(0, floor(point.y / max(1, bounds.height / 6)))))
    }
    override func mouseDown(with event: NSEvent) {
        model.capture()
        guard model.canArrange else { return }
        model.selecting = true
        first = cell(event); last = first
        needsDisplay = true
    }
    override func mouseDragged(with event: NSEvent) {
        guard first != nil else { return }
        last = cell(event); needsDisplay = true
    }
    override func mouseUp(with event: NSEvent) {
        defer { first = nil; last = nil; model.selecting = false; needsDisplay = true }
        guard let a = first else { return }
        let b = cell(event)
        model.apply(CGRect(x: min(a.x,b.x)/6, y: min(a.y,b.y)/6, width: (abs(a.x-b.x)+1)/6, height: (abs(a.y-b.y)+1)/6))
    }
    override func draw(_ dirtyRect: NSRect) {
        for y in 0..<6 {
            for x in 0..<6 {
                let chosen: Bool
                if let a = first, let b = last {
                    chosen = CGFloat(x) >= min(a.x,b.x) && CGFloat(x) <= max(a.x,b.x) && CGFloat(y) >= min(a.y,b.y) && CGFloat(y) <= max(a.y,b.y)
                } else { chosen = false }
                (chosen ? NSColor.controlAccentColor : NSColor.labelColor.withAlphaComponent(0.1)).setFill()
                let rect = CGRect(x: CGFloat(x)*bounds.width/6+2, y: CGFloat(y)*bounds.height/6+2, width: bounds.width/6-4, height: bounds.height/6-4)
                NSBezierPath(roundedRect: rect, xRadius: 5, yRadius: 5).fill()
            }
        }
    }
}

struct GridView: View {
    @ObservedObject var model: Model
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "square.grid.3x3.fill").foregroundStyle(.blue)
                Text("Gridlet").font(.title2.bold())
                Text("0.3.1").font(.caption).foregroundStyle(.secondary)
                Spacer()
                Button { model.closeGrid?() } label: { Image(systemName: "xmark") }.buttonStyle(.plain).accessibilityLabel("Close grid")
            }
            HStack(spacing: 10) {
                if let icon = model.appIcon { Image(nsImage: icon).resizable().frame(width: 32, height: 32) }
                VStack(alignment: .leading, spacing: 3) {
                    Text(model.appName).font(.headline)
                    Text(model.windowTitle).font(.caption).foregroundStyle(.secondary).lineLimit(2).help(model.windowTitle)
                }
                Spacer(minLength: 0)
            }.frame(maxWidth: .infinity, minHeight: 48, alignment: .leading)
            if !model.trusted {
                VStack(alignment: .leading, spacing: 8) {
                    Label("Accessibility permission required", systemImage: "lock.fill").font(.callout.bold())
                    Text("Enable Gridlet in Privacy & Security → Accessibility. Already enabled? Remove the old entry, then add this copy using Show app.")
                        .font(.caption).fixedSize(horizontal: false, vertical: true)
                    HStack {
                        Button("Open Accessibility Settings") { model.permissions() }
                        Button("Show app") { NSWorkspace.shared.activateFileViewerSelecting([Bundle.main.bundleURL]) }
                    }.font(.caption)
                }.padding(12).frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.orange.opacity(0.12), in: RoundedRectangle(cornerRadius: 8))
            }
            Text(model.message).font(.callout).foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, minHeight: 38, alignment: .topLeading)
                .fixedSize(horizontal: false, vertical: true)
            Picker("Display", selection: $model.display) {
                ForEach(model.screens.indices, id: \.self) { i in Text(model.screens[i].localizedName).tag(i) }
            }
            SelectionGrid(model: model).frame(height: 204)
                .opacity(model.canArrange ? 1 : 0.35)
            VStack(alignment: .leading, spacing: 3) {
                Text("Drag across the grid to place your window.")
                Text(model.shortcutStatus)
            }.font(.caption).foregroundStyle(.secondary)
            HStack {
                preset("Left ½", 0, 0.5)
                preset("Right ½", 0.5, 0.5)
                preset("Full", 0, 1)
            }
            HStack {
                preset("Left ⅓", 0, 1.0/3)
                preset("Center ⅓", 1.0/3, 1.0/3)
                preset("Right ⅓", 2.0/3, 1.0/3)
            }
            Divider()
            HStack {
                Button("Undo") { model.undo() }.disabled(!model.trusted || !model.canUndo)
                Spacer()
                Button("Accessibility…") { model.permissions() }
                Button("Quit") { NSApp.terminate(nil) }
            }.font(.caption)
        }.padding(22).frame(width: 370).background(.regularMaterial)
    }
    func preset(_ title: String, _ x: CGFloat, _ width: CGFloat) -> some View {
        Button(title) { model.apply(CGRect(x: x, y: 0, width: width, height: 1)) }.frame(maxWidth: .infinity).disabled(!model.canArrange)
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    var status: NSStatusItem!
    var panel: NSPanel!
    var selectionTimer: Timer?
    var hotKey: EventHotKeyRef?
    var hotKeyHandler: EventHandlerRef?
    let model = Model()
    func applicationDidFinishLaunching(_ notification: Notification) {
        status = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        status.button?.image = NSImage(systemSymbolName: "square.grid.3x3", accessibilityDescription: "Gridlet window manager")
        status.button?.target = self
        status.button?.action = #selector(toggle)
        panel = NSPanel(contentRect: .zero, styleMask: [.titled, .fullSizeContentView, .nonactivatingPanel], backing: .buffered, defer: false)
        panel.titleVisibility = .hidden
        panel.titlebarAppearsTransparent = true
        panel.isFloatingPanel = true
        panel.hidesOnDeactivate = false
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        panel.isReleasedWhenClosed = false
        panel.contentView = NSHostingView(rootView: GridView(model: model))
        panel.setContentSize(NSSize(width: 370, height: 720))
        panel.isMovableByWindowBackground = false
        selectionTimer = Timer.scheduledTimer(withTimeInterval: 0.4, repeats: true) { [weak self] _ in
            guard let self, self.panel.isVisible else { return }
            self.model.capture()
        }
        model.closeGrid = { [weak self] in self?.panel.orderOut(nil) }
        registerShortcut()
        toggle()
    }
    func registerShortcut() {
        var event = EventTypeSpec(eventClass: OSType(kEventClassKeyboard), eventKind: UInt32(kEventHotKeyPressed))
        let installed = InstallEventHandler(GetApplicationEventTarget(), { _, event, context in
            guard let event, let context else { return OSStatus(eventNotHandledErr) }
            var identifier = EventHotKeyID()
            guard GetEventParameter(event, EventParamName(kEventParamDirectObject), EventParamType(typeEventHotKeyID), nil, MemoryLayout<EventHotKeyID>.size, nil, &identifier) == noErr,
                  identifier.signature == 0x47524C54, identifier.id == 1 else { return OSStatus(eventNotHandledErr) }
            let delegate = Unmanaged<AppDelegate>.fromOpaque(context).takeUnretainedValue()
            delegate.toggleFromShortcut()
            return noErr
        }, 1, &event, Unmanaged.passUnretained(self).toOpaque(), &hotKeyHandler)
        guard installed == noErr else {
            model.shortcutStatus = "Shortcut unavailable. Use the menu bar grid."
            return
        }
        let registered = RegisterEventHotKey(UInt32(kVK_ANSI_D), UInt32(cmdKey | shiftKey), EventHotKeyID(signature: 0x47524C54, id: 1), GetApplicationEventTarget(), 0, &hotKey)
        if registered != noErr {
            model.shortcutStatus = "⌘⇧D unavailable; another app may be using it."
        }
    }
    func applicationWillTerminate(_ notification: Notification) {
        selectionTimer?.invalidate()
        if let hotKey { UnregisterEventHotKey(hotKey) }
        if let hotKeyHandler { RemoveEventHandler(hotKeyHandler) }
    }
    func toggleFromShortcut() {
        if panel.isVisible { panel.orderOut(nil); return }
        model.capture()
        if model.screens.indices.contains(model.display) {
            let screen = model.screens[model.display].visibleFrame
            panel.setFrameOrigin(NSPoint(x: screen.midX - panel.frame.width / 2, y: screen.midY - panel.frame.height / 2))
        }
        panel.orderFrontRegardless()
    }
    @objc func toggle() {
        if panel.isVisible { panel.orderOut(nil); return }
        model.capture()
        if let button = status.button, let window = button.window {
            let anchor = window.convertToScreen(button.frame)
            let screen = window.screen?.visibleFrame ?? NSScreen.main!.visibleFrame
            panel.setFrameTopLeftPoint(NSPoint(x: min(max(screen.minX, anchor.midX - 185), screen.maxX - 370), y: screen.maxY))
        } else { panel.center() }
        panel.orderFrontRegardless()
    }
}

let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let delegate = AppDelegate()
app.delegate = delegate
app.run()
