use tauri::{AppHandle, Manager, PhysicalPosition, Runtime};
use crate::db::Database;

pub fn setup_main_window<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("main") {
        // Always on top
        window.set_always_on_top(true)?;

        // Set window level and behavior (macOS)
        #[cfg(target_os = "macos")]
        {
            use cocoa::appkit::{NSWindow, NSWindowCollectionBehavior};
            use cocoa::base::id;

            let ns_window = window.ns_window().unwrap() as id;
            unsafe {
                // Set level to NSFloatingWindowLevel (3) - high enough to be visible but not blocking
                ns_window.setLevel_(3);

                // Set collection behavior to allow positioning on all spaces
                let behavior = NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces
                    | NSWindowCollectionBehavior::NSWindowCollectionBehaviorStationary;
                ns_window.setCollectionBehavior_(behavior);
            }
        }

        // Restore saved position (with validation)
        if let Some(db) = app.try_state::<Database>() {
            if let Ok(pos_json) = db.get_setting("floating_window_position") {
                if let Ok(pos) = serde_json::from_str::<WindowPosition>(&pos_json) {
                    // Validate position is within reasonable bounds (not off-screen)
                    // Allow negative values but ensure window is at least partially visible
                    if pos.x >= -200.0 && pos.y >= -100.0 && pos.x < 5000.0 && pos.y < 5000.0 {
                        let _ = window.set_position(PhysicalPosition::new(pos.x as i32, pos.y as i32));
                    } else {
                        // Invalid position, clear it from database
                        let _ = db.set_setting("floating_window_position", "");
                    }
                }
            }
        }

        // Listen for position changes and save them
        let app_handle = app.clone();
        window.on_window_event(move |event| {
            if let tauri::WindowEvent::Moved(position) = event {
                // Save position to database (screen bounds already validated on restore)
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
