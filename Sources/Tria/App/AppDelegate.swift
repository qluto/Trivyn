import AppKit
import SwiftUI

final class AppDelegate: NSObject, NSApplicationDelegate {
    private var statusBarController: StatusBarController?
    private var floatingWindowController: FloatingWindowController?

    func applicationDidFinishLaunching(_ notification: Notification) {
        // メニューバー常駐の設定
        statusBarController = StatusBarController()

        // フローティングウィンドウの初期化
        floatingWindowController = FloatingWindowController.shared

        // Dockアイコンを非表示（メニューバー常駐アプリとして動作）
        NSApp.setActivationPolicy(.accessory)
    }

    func applicationWillTerminate(_ notification: Notification) {
        // クリーンアップ処理
    }
}
