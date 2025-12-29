use tauri::{
    AppHandle, Manager, PhysicalPosition, PhysicalSize, Runtime,
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
};
use crate::db::Database;

// Get localized menu text based on language setting
fn get_menu_text(language: &str, key: &str) -> &'static str {
    match (language, key) {
        ("en", "show_floating") => "Show Floating Window",
        ("en", "quit") => "Quit",
        (_, "show_floating") => "フローティングウィンドウを表示",
        (_, "quit") => "終了",
        _ => "Unknown", // Fallback for unknown keys
    }
}

pub fn create_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    // Get current language setting from database
    let db: tauri::State<Database> = app.state();
    let language = db.get_setting("language")
        .unwrap_or_else(|_| "system".to_string());

    // Determine effective language
    let effective_lang = if language == "system" {
        // Default to Japanese for system language
        // In practice, you might want to detect the system language
        "ja"
    } else {
        language.as_str()
    };

    // Create menu items with localized text
    let show_floating_item = MenuItem::with_id(
        app,
        "show_floating",
        get_menu_text(effective_lang, "show_floating"),
        true,
        None::<&str>
    )?;
    let quit_item = MenuItem::with_id(
        app,
        "quit",
        get_menu_text(effective_lang, "quit"),
        true,
        None::<&str>
    )?;

    // Create menu
    let menu = Menu::with_items(app, &[&show_floating_item, &quit_item])?;

    // Create tray icon
    let tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false) // Disable menu on left click
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "show_floating" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(move |tray, event| {
            if let TrayIconEvent::Click {
                button: tauri::tray::MouseButton::Left,
                button_state: tauri::tray::MouseButtonState::Up,
                position,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("popover") {
                    let is_visible = window.is_visible().unwrap_or(false);

                    if is_visible {
                        let _ = window.hide();
                    } else {
                        // Get window and monitor info
                        let window_size = window.outer_size().unwrap_or(PhysicalSize { width: 420, height: 400 });
                        let monitor = window.current_monitor().ok().flatten();

                        // Platform-specific positioning logic
                        #[cfg(target_os = "macos")]
                        let (x, y) = if let Some(monitor) = monitor {
                            let monitor_size = monitor.size();
                            let monitor_pos = monitor.position();

                            // Calculate monitor bounds
                            let monitor_top = monitor_pos.y;
                            let monitor_bottom = monitor_pos.y + monitor_size.height as i32;
                            let monitor_height = monitor_size.height as i32;

                            // Determine if tray is in top half or bottom half of screen
                            let tray_y = position.y as i32;
                            let is_tray_on_top = tray_y < (monitor_top + monitor_height / 2);

                            // Center horizontally relative to tray icon
                            let x = (position.x as i32 - (window_size.width as i32 / 2))
                                .max(monitor_pos.x)
                                .min(monitor_pos.x + monitor_size.width as i32 - window_size.width as i32);

                            // Position vertically based on tray location
                            let y = if is_tray_on_top {
                                // Tray is on top (macOS) - position window below tray
                                (tray_y + 10).min(monitor_bottom - window_size.height as i32)
                            } else {
                                // Tray is on bottom - position window above tray
                                (tray_y - window_size.height as i32 - 10).max(monitor_top)
                            };

                            (x, y)
                        } else {
                            // Fallback if monitor info unavailable
                            let x = position.x as i32 - 210;
                            let y = position.y as i32 + 10;
                            (x, y)
                        };

                        // Windows/Linux: Center popover on screen
                        #[cfg(not(target_os = "macos"))]
                        let (x, y) = if let Some(monitor) = monitor {
                            let monitor_size = monitor.size();
                            let monitor_pos = monitor.position();

                            // Center both horizontally and vertically on screen
                            let x = monitor_pos.x + (monitor_size.width as i32 - window_size.width as i32) / 2;
                            let y = monitor_pos.y + (monitor_size.height as i32 - window_size.height as i32) / 2;

                            (x, y)
                        } else {
                            // Fallback if monitor info unavailable - approximate center
                            let x = position.x as i32 - (window_size.width as i32 / 2);
                            let y = position.y as i32 - (window_size.height as i32 / 2);
                            (x, y)
                        };

                        let _ = window.set_position(PhysicalPosition::new(x, y));
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .build(app)?;

    // Store the tray icon ID in app state
    app.manage(TrayIconId(tray.id().clone()));

    Ok(())
}

// Wrapper for TrayIconId to store in app state
struct TrayIconId(tauri::tray::TrayIconId);

impl TrayIconId {
    fn get(&self) -> &tauri::tray::TrayIconId {
        &self.0
    }
}

// Update tray menu with new language
pub fn update_tray_menu<R: Runtime>(app: &AppHandle<R>, language: &str) -> tauri::Result<()> {
    // Get the stored tray icon ID
    let tray_id = app.state::<TrayIconId>();

    // Get the tray icon using the stored ID
    if let Some(tray) = app.tray_by_id(tray_id.get()) {
        // Create new menu items with updated text
        let show_floating_item = MenuItem::with_id(
            app,
            "show_floating",
            get_menu_text(language, "show_floating"),
            true,
            None::<&str>
        )?;
        let quit_item = MenuItem::with_id(
            app,
            "quit",
            get_menu_text(language, "quit"),
            true,
            None::<&str>
        )?;

        // Create new menu
        let menu = Menu::with_items(app, &[&show_floating_item, &quit_item])?;

        // Update the tray menu
        tray.set_menu(Some(menu))?;
    }

    Ok(())
}
