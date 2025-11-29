import AppKit
import SwiftUI

/// メニューバー常駐を管理するコントローラー
@MainActor
final class StatusBarController {
    private var statusItem: NSStatusItem?
    private var popover: NSPopover?

    init() {
        setupStatusItem()
        setupPopover()
    }

    private func setupStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)

        if let button = statusItem?.button {
            // 三角形アイコン（システムシンボル）
            let config = NSImage.SymbolConfiguration(pointSize: 14, weight: .medium)
            button.image = NSImage(systemSymbolName: "triangle.fill", accessibilityDescription: "Tria")?
                .withSymbolConfiguration(config)
            button.action = #selector(togglePopover)
            button.target = self
            button.sendAction(on: [.leftMouseUp, .rightMouseUp])
        }
    }

    private func setupPopover() {
        popover = NSPopover()
        popover?.contentSize = NSSize(width: 320, height: 400)
        popover?.behavior = .transient
        popover?.animates = true
        popover?.contentViewController = NSHostingController(
            rootView: MenuBarPopoverView()
                .environmentObject(GoalStore.shared)
        )
    }

    @objc private func togglePopover(_ sender: NSStatusBarButton) {
        let event = NSApp.currentEvent

        if event?.type == .rightMouseUp {
            showContextMenu(sender)
        } else {
            if let popover = popover {
                if popover.isShown {
                    popover.performClose(sender)
                } else {
                    popover.show(relativeTo: sender.bounds, of: sender, preferredEdge: .minY)

                    // ポップオーバーがアクティブになるようにする
                    popover.contentViewController?.view.window?.makeKey()
                }
            }
        }
    }

    private func showContextMenu(_ sender: NSStatusBarButton) {
        let menu = NSMenu()

        menu.addItem(NSMenuItem(
            title: "フローティングウィンドウを表示",
            action: #selector(showFloatingWindow),
            keyEquivalent: "f"
        ))
        menu.items.last?.target = self

        menu.addItem(NSMenuItem.separator())

        menu.addItem(NSMenuItem(
            title: "Triaを終了",
            action: #selector(quitApp),
            keyEquivalent: "q"
        ))
        menu.items.last?.target = self

        statusItem?.menu = menu
        statusItem?.button?.performClick(nil)
        statusItem?.menu = nil
    }

    @objc private func showFloatingWindow() {
        FloatingWindowController.shared.showWindow()
    }

    @objc private func quitApp() {
        NSApplication.shared.terminate(nil)
    }
}
