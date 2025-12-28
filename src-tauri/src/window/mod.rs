#![allow(deprecated)]

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
        let window_clone = window.clone();
        window.on_window_event(move |event| {
            if let tauri::WindowEvent::Moved(_position) = event {
                // Constrain window to screen bounds
                if let Err(e) = constrain_window_to_screen(&window_clone) {
                    eprintln!("Failed to constrain window to screen: {}", e);
                }

                // Save position to database after constraining
                if let Ok(final_position) = window_clone.outer_position() {
                    if let Some(db) = app_handle.try_state::<Database>() {
                        let pos = WindowPosition {
                            x: final_position.x as f64,
                            y: final_position.y as f64,
                        };
                        if let Ok(json) = serde_json::to_string(&pos) {
                            let _ = db.set_setting("floating_window_position", &json);
                        }
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

#[cfg(target_os = "macos")]
/// Get the visible frame (work area) of the screen containing the window
/// This excludes menu bar, Dock, and other system UI elements
fn get_screen_visible_frame<R: Runtime>(window: &tauri::WebviewWindow<R>) -> Option<(i32, i32, i32, i32)> {
    use cocoa::appkit::NSScreen;
    use cocoa::base::id;

    let ns_window = window.ns_window().ok()? as id;

    unsafe {
        // Get the screen that contains this window
        let screen: id = cocoa::appkit::NSWindow::screen(ns_window);
        if screen.is_null() {
            return None;
        }

        // Get the visible frame (excludes menu bar and Dock)
        let visible_frame = NSScreen::visibleFrame(screen);

        // NSScreen coordinates have origin at bottom-left, need to convert to top-left
        // Get the full frame to calculate the offset
        let full_frame = NSScreen::frame(screen);

        // Convert from bottom-left origin to top-left origin
        // visible_frame.origin.y is the distance from bottom of screen to bottom of visible area (Dock height)
        // visible_frame.size.height is the height of the visible area
        let screen_left = visible_frame.origin.x as i32;
        let screen_top = (full_frame.size.height - visible_frame.origin.y - visible_frame.size.height) as i32;
        let screen_right = (visible_frame.origin.x + visible_frame.size.width) as i32;
        // screen_bottom should be top + visible height, not full height
        let screen_bottom = screen_top + visible_frame.size.height as i32;

        Some((screen_left, screen_top, screen_right, screen_bottom))
    }
}

/// Constrains the window position to ensure it stays within screen bounds
fn constrain_window_to_screen<R: Runtime>(window: &tauri::WebviewWindow<R>) -> tauri::Result<()> {
    // Get current window position and size
    let position = window.outer_position()?;
    let size = window.outer_size()?;

    // Get screen boundaries
    #[cfg(target_os = "macos")]
    let (screen_left, screen_top, screen_right, screen_bottom) = {
        // Get Tauri's monitor info (uses correct scale)
        let monitor = window.current_monitor()?.ok_or_else(|| {
            tauri::Error::Anyhow(anyhow::anyhow!("No monitor found"))
        })?;
        let monitor_size = monitor.size();
        let monitor_pos = monitor.position();

        // Use macOS-specific API to get visible frame, then scale to Tauri's coordinate system
        if let Some(ns_bounds) = get_screen_visible_frame(window) {
            // NSScreen returns logical pixels (points), but Tauri uses physical pixels
            // Calculate scale factor from monitor size vs NSScreen size
            let scale_factor = monitor_size.width as f64 / 1680.0; // NSScreen reports 1680 width

            let scaled_bounds = (
                (ns_bounds.0 as f64 * scale_factor) as i32,
                (ns_bounds.1 as f64 * scale_factor) as i32,
                (ns_bounds.2 as f64 * scale_factor) as i32,
                (ns_bounds.3 as f64 * scale_factor) as i32,
            );
            scaled_bounds
        } else {
            // Fallback to monitor API with estimated margins for menu bar and Dock
            const MENU_BAR_HEIGHT: i32 = 50; // Approximate menu bar height (scaled)
            const DOCK_MARGIN: i32 = 10; // Small margin for auto-hiding Dock
            (
                monitor_pos.x,
                monitor_pos.y + MENU_BAR_HEIGHT,
                monitor_pos.x + monitor_size.width as i32,
                monitor_pos.y + monitor_size.height as i32 - DOCK_MARGIN,
            )
        }
    };

    #[cfg(not(target_os = "macos"))]
    let (screen_left, screen_top, screen_right, screen_bottom) = {
        // For non-macOS platforms, use monitor API with a margin to account for taskbars
        let monitor = window.current_monitor()?.ok_or_else(|| {
            tauri::Error::Anyhow(anyhow::anyhow!("No monitor found"))
        })?;
        let work_area = monitor.size();
        let monitor_pos = monitor.position();
        const TASKBAR_MARGIN: i32 = 60; // Approximate taskbar height
        (
            monitor_pos.x,
            monitor_pos.y,
            monitor_pos.x + work_area.width as i32,
            monitor_pos.y + work_area.height as i32 - TASKBAR_MARGIN,
        )
    };

    // Calculate window boundaries
    let window_left = position.x;
    let window_top = position.y;
    let window_right = position.x + size.width as i32;
    let window_bottom = position.y + size.height as i32;

    // Calculate new position if window is out of bounds
    let mut new_x = position.x;
    let mut new_y = position.y;
    let mut needs_adjustment = false;

    // Check horizontal bounds
    if window_right > screen_right {
        new_x = screen_right - size.width as i32;
        needs_adjustment = true;
    }
    if window_left < screen_left {
        new_x = screen_left;
        needs_adjustment = true;
    }

    // Check vertical bounds
    if window_bottom > screen_bottom {
        new_y = screen_bottom - size.height as i32;
        needs_adjustment = true;
    }
    if window_top < screen_top {
        new_y = screen_top;
        needs_adjustment = true;
    }

    // Apply position adjustment if needed
    if needs_adjustment {
        window.set_position(PhysicalPosition::new(new_x, new_y))?;
    }

    Ok(())
}
