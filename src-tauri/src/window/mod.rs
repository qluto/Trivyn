use tauri::{AppHandle, Manager, PhysicalPosition, Runtime};
use crate::db::Database;

pub fn setup_main_window<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("main") {
        // Always on top
        window.set_always_on_top(true)?;

        // Restore saved position
        if let Some(db) = app.try_state::<Database>() {
            if let Ok(pos_json) = db.get_setting("floating_window_position") {
                if let Ok(pos) = serde_json::from_str::<WindowPosition>(&pos_json) {
                    let _ = window.set_position(PhysicalPosition::new(pos.x as i32, pos.y as i32));
                }
            }
        }

        // Listen for position changes and save them
        let app_handle = app.clone();
        window.on_window_event(move |event| {
            if let tauri::WindowEvent::Moved(position) = event {
                if let Some(db) = app_handle.try_state::<Database>() {
                    let pos = WindowPosition {
                        x: position.x as f64,
                        y: position.y as f64,
                    };
                    if let Ok(json) = serde_json::to_string(&pos) {
                        let _ = db.set_setting("floating_window_position", &json);
                    }
                }
            }
        });
    }

    Ok(())
}

pub fn setup_popover_window<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("popover") {
        // Always on top
        window.set_always_on_top(true)?;

        // Don't hide on blur - keep visible until explicitly closed
        let app_handle = app.clone();
        window.on_window_event(move |event| {
            match event {
                tauri::WindowEvent::Focused(false) => {
                    // Window lost focus - check if click was outside
                    // For now, keep it visible
                }
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    // Prevent actual close, just hide
                    api.prevent_close();
                    if let Some(window) = app_handle.get_webview_window("popover") {
                        let _ = window.hide();
                    }
                }
                _ => {}
            }
        });
    }

    Ok(())
}

#[derive(serde::Serialize, serde::Deserialize)]
struct WindowPosition {
    x: f64,
    y: f64,
}
