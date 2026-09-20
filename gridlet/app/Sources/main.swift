import AppKit
import SwiftUI
import ApplicationServices
import Carbon

final class Model: ObservableObject {
    @Published var message = "Choose a window, then open Gridlet."
    @Published var display = 0
    @Published var screens = NSScreen.screens
    @Published var shortcutStatus = "⌘⇧D · Show or hide grid"
    var closeGrid: (() -> Void)?
    var target: AXUIElement?
    var previous: (AXUIElement, CGPoint, CGSize)?

    func capture() {
        screens = NSScreen.screens
        display = min(display, max(0, screens.count - 1))
        target = nil
        guard AXIsProcessTrusted() else {
            message = "Enable Accessibility to arrange windows."
            return
        }
        guard let app = NSWorkspace.shared.frontmostApplication,
              app.processIdentifier != ProcessInfo.processInfo.processIdentifier else { return }
        var value: CFTypeRef?
        let element = AXUIElementCreateApplication(app.processIdentifier)
        guard AXUIElementCopyAttributeValue(element, kAXFocusedWindowAttribute as CFString, &value) == .success,
              let value, CFGetTypeID(value) == AXUIElementGetTypeID() else {
            message = "This app has no movable focused window."
            return
        }
        target = (value as! AXUIElement)
        message = app.localizedName ?? "Active window"
        if let target, let frame = frame(target) {
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
        guard AXIsProcessTrusted() else { message = "Enable Accessibility, then reopen the grid."; return }
        guard let target, screens.indices.contains(display) else { message = "Focus a window and reopen the grid."; return }
        if let f = frame(target) { previous = (target, f.0, f.1) }
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
            message = "This window could not be moved or resized."
        } else if let actual = frame(window), abs(actual.1.width - size.width) > 3 || abs(actual.1.height - size.height) > 3 {
            message = "Arranged with the app’s minimum size limits."
        } else { message = "Window arranged." }
    }
    func undo() { if let old = previous { set(old.0, old.1, old.2); previous = nil } }
    func permissions() {
        NSWorkspace.shared.open(URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")!)
    }
}

struct GridView: View {
    @ObservedObject var model: Model
    @State private var start: CGPoint?
    @State private var end: CGPoint?
    private let columns = 6
    func cell(_ point: CGPoint, _ size: CGSize) -> CGPoint {
        CGPoint(x: min(5, max(0, floor(point.x / (size.width / 6)))), y: min(5, max(0, floor(point.y / (size.height / 6)))))
    }
    func selected(_ x: Int, _ y: Int) -> Bool {
        guard let a = start, let b = end else { return false }
        return CGFloat(x) >= min(a.x,b.x) && CGFloat(x) <= max(a.x,b.x) && CGFloat(y) >= min(a.y,b.y) && CGFloat(y) <= max(a.y,b.y)
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "square.grid.3x3.fill").foregroundStyle(.blue)
                Text("Gridlet").font(.title2.bold())
                Spacer()
                Button { model.closeGrid?() } label: { Image(systemName: "xmark") }.buttonStyle(.plain).accessibilityLabel("Close grid")
            }
            Text(model.message).font(.callout).foregroundStyle(.secondary).frame(height: 36, alignment: .topLeading)
            Picker("Display", selection: $model.display) {
                ForEach(model.screens.indices, id: \.self) { i in Text(model.screens[i].localizedName).tag(i) }
            }
            GeometryReader { geometry in
                VStack(spacing: 5) {
                    ForEach(0..<columns, id: \.self) { y in
                        HStack(spacing: 5) {
                            ForEach(0..<columns, id: \.self) { x in
                                RoundedRectangle(cornerRadius: 5).fill(selected(x,y) ? Color.accentColor : Color.primary.opacity(0.09))
                            }
                        }
                    }
                }
                .contentShape(Rectangle())
                .gesture(DragGesture(minimumDistance: 0).onChanged { value in
                    if start == nil { start = cell(value.startLocation, geometry.size) }
                    end = cell(value.location, geometry.size)
                }.onEnded { value in
                    let a = start ?? cell(value.startLocation, geometry.size)
                    let b = cell(value.location, geometry.size)
                    model.apply(CGRect(x: min(a.x,b.x)/6, y: min(a.y,b.y)/6, width: (abs(a.x-b.x)+1)/6, height: (abs(a.y-b.y)+1)/6))
                    start = nil; end = nil
                })
                .accessibilityLabel("Six by six window layout grid. Drag to select a region, or use the preset buttons below.")
            }.frame(height: 204)
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
                Button("Undo") { model.undo() }
                Spacer()
                Button("Accessibility…") { model.permissions() }
                Button("Quit") { NSApp.terminate(nil) }
            }.font(.caption)
        }.padding(22).frame(width: 370).background(.regularMaterial)
    }
    func preset(_ title: String, _ x: CGFloat, _ width: CGFloat) -> some View {
        Button(title) { model.apply(CGRect(x: x, y: 0, width: width, height: 1)) }.frame(maxWidth: .infinity)
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    var status: NSStatusItem!
    var panel: NSPanel!
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
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        panel.isReleasedWhenClosed = false
        panel.contentView = NSHostingView(rootView: GridView(model: model))
        panel.setContentSize(NSSize(width: 370, height: 530))
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
