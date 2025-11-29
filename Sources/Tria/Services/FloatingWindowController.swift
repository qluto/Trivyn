import AppKit
import SwiftUI
import Combine

/// キー入力を受け付けるカスタムパネル
final class FloatingPanel: NSPanel {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { false }
}

/// Stickies風フローティングウィンドウを管理するコントローラー
@MainActor
final class FloatingWindowController {
    static let shared = FloatingWindowController()

    private var panel: NSPanel?
    private var hostingView: NSHostingView<AnyView>?
    private var isVisible = false
    private var cancellables = Set<AnyCancellable>()

    private init() {
        setupPanel()
        observeGoalChanges()
        observeWindowMove()
    }

    private func setupPanel() {
        let contentRect = NSRect(x: 0, y: 0, width: 240, height: 100)

        panel = FloatingPanel(
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
        panel.hasShadow = false  // SwiftUI側でシャドウを描画
        panel.isMovableByWindowBackground = true
        panel.becomesKeyOnlyIfNeeded = true  // テキストフィールドクリック時のみキーウィンドウに

        // 最小/最大サイズ
        panel.minSize = NSSize(width: 200, height: 60)
        panel.maxSize = NSSize(width: 300, height: 400)

        // SwiftUI Viewをホスト
        let view = NSHostingView(
            rootView: AnyView(
                FloatingWindowView()
                    .environmentObject(GoalStore.shared)
            )
        )
        hostingView = view
        panel.contentView = view

        // 位置を復元または画面右下に配置
        restoreWindowPosition()

        // 初期サイズを設定
        updateWindowSize()
    }

    private func observeGoalChanges() {
        GoalStore.shared.$goals
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                self?.updateWindowSize()
            }
            .store(in: &cancellables)
    }

    private func updateWindowSize() {
        guard let panel = panel, let hostingView = hostingView else { return }

        // SwiftUIビューの理想的なサイズを取得
        let fittingSize = hostingView.fittingSize

        // 現在のウィンドウ位置を保持（右下基準で調整）
        let currentFrame = panel.frame
        let newHeight = max(fittingSize.height, panel.minSize.height)
        let newWidth = max(fittingSize.width, panel.minSize.width)

        // 高さが変わった分だけY座標を調整（下端を固定）
        let deltaHeight = newHeight - currentFrame.height
        let newOrigin = NSPoint(
            x: currentFrame.origin.x,
            y: currentFrame.origin.y - deltaHeight
        )

        let newFrame = NSRect(
            origin: newOrigin,
            size: NSSize(width: newWidth, height: newHeight)
        )

        // AppKitのフレームアニメーションとSwiftUI側のレイアウトアニメーションが重なると
        // 上部バーや角丸が揺れるため、ここでは即時リサイズにする
        panel.setFrame(newFrame, display: true, animate: false)
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
            // デフォルト: 画面上部中央
            if let screen = NSScreen.main {
                let screenRect = screen.visibleFrame
                let x = screenRect.midX - panel.frame.width / 2
                let y = screenRect.maxY - panel.frame.height - 40
                panel.setFrameOrigin(NSPoint(x: x, y: y))
            }
        }
    }

    func saveWindowPosition() {
        guard let panel = panel else { return }
        let positionString = NSStringFromPoint(panel.frame.origin)
        UserDefaults.standard.set(positionString, forKey: positionKey)
    }

    private func observeWindowMove() {
        guard let panel = panel else { return }

        NotificationCenter.default.publisher(for: NSWindow.didMoveNotification, object: panel)
            .debounce(for: .milliseconds(500), scheduler: DispatchQueue.main)
            .sink { [weak self] _ in
                self?.saveWindowPosition()
            }
            .store(in: &cancellables)
    }
}
