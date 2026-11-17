use tauri::{
    AppHandle, Manager, Rect, Runtime,
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
};
use crate::db::Database;
use crate::popover;

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
        .tooltip("Trivyn")
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
                rect,
                ..
            } = event
            {
                let app = tray.app_handle();
                let Some(window) = app.get_webview_window(popover::POPOVER_LABEL) else {
                    return;
                };

                if window.is_visible().unwrap_or(false) {
                    popover::hide_popover(app);
                    return;
                }

                // マウスダウンでポップオーバーがブラーして閉じた直後のクリックは
                // 「閉じる操作」とみなし、再表示しない
                if let Some(state) = app.try_state::<popover::PopoverState>() {
                    if state.was_just_hidden_by_blur() {
                        return;
                    }
                }

                popover::show_popover(app, Some(rect), false);
                let _ = window.set_focus();
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

/// 保存済みトレイアイコンの矩形を取得（Linux では常に None）
pub fn tray_rect<R: Runtime>(app: &AppHandle<R>) -> Option<Rect> {
    let tray_id = app.try_state::<TrayIconId>()?;
    let tray = app.tray_by_id(tray_id.get())?;
    tray.rect().ok().flatten()
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
