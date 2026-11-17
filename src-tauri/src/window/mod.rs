#![allow(deprecated)]

use tauri::{AppHandle, Manager, PhysicalPosition, Runtime};
use crate::db::Database;
use crate::popover::{hide_popover, notify_hidden, PopoverState, POPOVER_LABEL};

pub fn setup_main_window<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("main") {
        // Always on top
        window.set_always_on_top(true)?;

        // Set window level and behavior (macOS)
        #[cfg(target_os = "macos")]
        {
            use cocoa::appkit::{NSWindow, NSWindowCollectionBehavior};
            use cocoa::base::{id, YES};
            use objc::{msg_send, sel, sel_impl};

            let ns_window = window.ns_window().unwrap() as id;
            unsafe {
                // Set level to NSFloatingWindowLevel (3) - high enough to be visible but not blocking
                ns_window.setLevel_(3);

                // Set collection behavior to allow positioning on all spaces
                let behavior = NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces
                    | NSWindowCollectionBehavior::NSWindowCollectionBehaviorStationary;
                ns_window.setCollectionBehavior_(behavior);

                // Enable rounded corners through content view layer
                let content_view: id = msg_send![ns_window, contentView];
                let _: () = msg_send![content_view, setWantsLayer: YES];
                let layer: id = msg_send![content_view, layer];
                let _: () = msg_send![layer, setCornerRadius: 12.0f64];
                let _: () = msg_send![layer, setMasksToBounds: YES];
            }
        }

        // Set window region to rounded rectangle on Windows
        // This clips the window shape itself to match CSS border-radius
        #[cfg(target_os = "windows")]
        {
            use windows::Win32::Foundation::HWND;
            use windows::Win32::Graphics::Dwm::{DwmSetWindowAttribute, DWMWA_WINDOW_CORNER_PREFERENCE, DWMWCP_DONOTROUND};
            use windows::Win32::Graphics::Gdi::{CreateRoundRectRgn, SetWindowRgn};

            if let Ok(hwnd) = window.hwnd() {
                let hwnd = HWND(hwnd.0 as _);

                // Disable native DWM corner rounding
                let preference = DWMWCP_DONOTROUND;
                unsafe {
                    let _ = DwmSetWindowAttribute(
                        hwnd,
                        DWMWA_WINDOW_CORNER_PREFERENCE,
                        &preference as *const _ as *const _,
                        std::mem::size_of_val(&preference) as u32,
                    );
                }

                // Get window size
                if let Ok(size) = window.outer_size() {
                    unsafe {
                        // Create rounded rectangle region (12px corner radius to match CSS)
                        let region = CreateRoundRectRgn(0, 0, size.width as i32, size.height as i32, 24, 24);
                        // Apply region to window (true = window redraws)
                        let _ = SetWindowRgn(hwnd, region, true);
                        // Note: SetWindowRgn takes ownership of the region, so we don't delete it
                    }
                }
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
            // ⌘W などの閉じる要求ではウィンドウを破棄せず隠す（トレイメニューから再表示できるように）
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window_clone.hide();
                return;
            }

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

        // Set corner radius for rounded corners (macOS)
        #[cfg(target_os = "macos")]
        {
            use cocoa::base::{id, YES};
            use objc::{msg_send, sel, sel_impl};

            let ns_window = window.ns_window().unwrap() as id;
            unsafe {
                // Enable rounded corners through content view layer
                let content_view: id = msg_send![ns_window, contentView];
                let _: () = msg_send![content_view, setWantsLayer: YES];
                let layer: id = msg_send![content_view, layer];
                let _: () = msg_send![layer, setCornerRadius: 12.0f64];
                let _: () = msg_send![layer, setMasksToBounds: YES];
            }
        }

        // Set window region to rounded rectangle on Windows
        // This clips the window shape itself to match CSS border-radius
        #[cfg(target_os = "windows")]
        {
            use windows::Win32::Foundation::HWND;
            use windows::Win32::Graphics::Dwm::{DwmSetWindowAttribute, DWMWA_WINDOW_CORNER_PREFERENCE, DWMWCP_DONOTROUND};
            use windows::Win32::Graphics::Gdi::{CreateRoundRectRgn, SetWindowRgn};

            if let Ok(hwnd) = window.hwnd() {
                let hwnd = HWND(hwnd.0 as _);

                // Disable native DWM corner rounding
                let preference = DWMWCP_DONOTROUND;
                unsafe {
                    let _ = DwmSetWindowAttribute(
                        hwnd,
                        DWMWA_WINDOW_CORNER_PREFERENCE,
                        &preference as *const _ as *const _,
                        std::mem::size_of_val(&preference) as u32,
                    );
                }

                // Get window size
                if let Ok(size) = window.outer_size() {
                    unsafe {
                        // Create rounded rectangle region (12px corner radius to match CSS)
                        let region = CreateRoundRectRgn(0, 0, size.width as i32, size.height as i32, 24, 24);
                        // Apply region to window (true = window redraws)
                        let _ = SetWindowRgn(hwnd, region, true);
                        // Note: SetWindowRgn takes ownership of the region, so we don't delete it
                    }
                }
            }
        }

        // フォーカスを失ったら閉じる（sticky 表示中は除く）
        let app_handle = app.clone();
        window.on_window_event(move |event| {
            match event {
                tauri::WindowEvent::Focused(false) => {
                    let Some(state) = app_handle.try_state::<PopoverState>() else {
                        return;
                    };
                    if state.is_sticky() {
                        return;
                    }
                    if let Some(window) = app_handle.get_webview_window(POPOVER_LABEL) {
                        if window.is_visible().unwrap_or(false) {
                            let _ = window.hide();
                            // トレイクリックによるブラーと再表示の競合を防ぐため時刻を記録
                            state.record_blur_hide();
                            notify_hidden(&app_handle);
                        }
                    }
                }
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    // 実際には閉じずに非表示にする
                    api.prevent_close();
                    hide_popover(&app_handle);
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

/// ウィンドウが作業領域（メニューバー・Dock・タスクバーを除く）からはみ出さないよう位置を補正する
fn constrain_window_to_screen<R: Runtime>(window: &tauri::WebviewWindow<R>) -> tauri::Result<()> {
    let position = window.outer_position()?;
    let size = window.outer_size()?;

    // ウィンドウが属するモニターの作業領域（物理ピクセル）
    let Some(monitor) = window.current_monitor()? else {
        return Ok(());
    };
    let work = monitor.work_area();
    let screen_left = work.position.x;
    let screen_top = work.position.y;
    let screen_right = work.position.x + work.size.width as i32;
    let screen_bottom = work.position.y + work.size.height as i32;

    let mut new_x = position.x;
    let mut new_y = position.y;

    // 右・下を先に、左・上を後に補正（ウィンドウが作業領域より大きい場合は左上を優先）
    if position.x + size.width as i32 > screen_right {
        new_x = screen_right - size.width as i32;
    }
    if new_x < screen_left {
        new_x = screen_left;
    }
    if position.y + size.height as i32 > screen_bottom {
        new_y = screen_bottom - size.height as i32;
    }
    if new_y < screen_top {
        new_y = screen_top;
    }

    // 位置が変わる場合のみ設定（Moved イベントの再入を最小化）
    if new_x != position.x || new_y != position.y {
        window.set_position(PhysicalPosition::new(new_x, new_y))?;
    }

    Ok(())
}
