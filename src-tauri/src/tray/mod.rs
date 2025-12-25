use tauri::{
    AppHandle, Manager, PhysicalPosition, Runtime,
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
                        // Position popup below tray icon
                        let x = position.x as i32 - 300; // Center the 600px wide window
                        let y = position.y as i32 + 10;  // Position below the menu bar

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
