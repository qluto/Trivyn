use tauri::{
    AppHandle, Manager, PhysicalPosition, PhysicalSize, Runtime,
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
};

pub fn create_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    // Create menu items
    let show_floating_item = MenuItem::with_id(app, "show_floating", "フローティングウィンドウを表示", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "終了", true, None::<&str>)?;

    // Create menu
    let menu = Menu::with_items(app, &[&show_floating_item, &quit_item])?;

    // Create tray icon
    let _tray = TrayIconBuilder::new()
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
                                // Tray is on bottom (Windows/Linux) - position window above tray
                                (tray_y - window_size.height as i32 - 10).max(monitor_top)
                            };

                            (x, y)
                        } else {
                            // Fallback if monitor info unavailable
                            let x = position.x as i32 - 210;
                            let y = position.y as i32 + 10;
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

    Ok(())
}
