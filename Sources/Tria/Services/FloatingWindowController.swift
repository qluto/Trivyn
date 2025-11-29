import AppKit
import SwiftUI

/// Stickies風フローティングウィンドウを管理するコントローラー
@MainActor
final class FloatingWindowController {
    static let shared = FloatingWindowController()

    private var panel: NSPanel?
    private var isVisible = false

    private init() {
        setupPanel()
    }

    private func setupPanel() {
        let contentRect = NSRect(x: 0, y: 0, width: 260, height: 300)

        panel = NSPanel(
            contentRect: contentRect,
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )

        guard let panel = panel else { return }

        // ミニマルなフローティングウィンドウの設定
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        panel.isFloatingPanel = true
        panel.hidesOnDeactivate = false
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = true
        panel.isMovableByWindowBackground = true

        // 最小/最大サイズ
        panel.minSize = NSSize(width: 200, height: 200)
        panel.maxSize = NSSize(width: 350, height: 500)

        // SwiftUI Viewをホスト
        let hostingView = NSHostingView(
            rootView: FloatingWindowView()
                .environmentObject(GoalStore.shared)
        )
        panel.contentView = hostingView

        // 位置を復元または画面右下に配置
        restoreWindowPosition()
    }

    func showWindow() {
        guard let panel = panel else { return }
        panel.orderFront(nil)
        isVisible = true
    }

    func hideWindow() {
        panel?.orderOut(nil)
        isVisible = false
    }

    func toggleWindow() {
        if isVisible {
            hideWindow()
        } else {
            showWindow()
        }
    }

    // MARK: - Position Persistence

    private let positionKey = "tria.floatingWindow.position"

    private func restoreWindowPosition() {
        guard let panel = panel else { return }

        if let positionString = UserDefaults.standard.string(forKey: positionKey) {
            let position = NSPointFromString(positionString)
            panel.setFrameOrigin(position)
        } else {
            // デフォルト: 画面右下
            if let screen = NSScreen.main {
                let screenRect = screen.visibleFrame
                let x = screenRect.maxX - panel.frame.width - 20
                let y = screenRect.minY + 20
                panel.setFrameOrigin(NSPoint(x: x, y: y))
            }
        }
    }

    func saveWindowPosition() {
        guard let panel = panel else { return }
        let positionString = NSStringFromPoint(panel.frame.origin)
        UserDefaults.standard.set(positionString, forKey: positionKey)
    }
}
