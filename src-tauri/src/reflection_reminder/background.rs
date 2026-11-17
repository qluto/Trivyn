use super::ReflectionReminder;
use std::sync::Arc;
use std::time::Duration;
use tauri::AppHandle;
use tokio::time::interval;

/// バックグラウンドで定期的に期間変更をチェック
pub async fn start_background_checker(reminder: Arc<ReflectionReminder>, app: AppHandle) {
    // 起動直後はトレイアイコンの配置や Webview の読み込みが完了していない可能性があるため少し待つ
    tokio::time::sleep(Duration::from_millis(1500)).await;

    // 最初の tick は即座に発火するため、これが起動時チェックを兼ねる
    let mut interval_timer = interval(Duration::from_secs(300)); // 5分間隔

    loop {
        interval_timer.tick().await;

        println!("[ReflectionReminder] Running periodic check...");

        if let Err(e) = reminder.check_and_notify(&app) {
            eprintln!("Reflection reminder check failed: {}", e);
        }
    }
}
