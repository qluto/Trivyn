// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

mod models;
mod db;
mod commands;
mod tray;
mod window;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Initialize database
            let app_handle = app.handle().clone();
            tauri::async_runtime::block_on(async move {
                if let Err(e) = db::init_database(&app_handle).await {
                    eprintln!("Failed to initialize database: {}", e);
                }
            });

            // Setup system tray
            if let Err(e) = tray::create_tray(app.handle()) {
                eprintln!("Failed to create system tray: {}", e);
            }

            // Setup main window
            if let Err(e) = window::setup_main_window(app.handle()) {
                eprintln!("Failed to setup main window: {}", e);
            }

            // Setup popover window
            if let Err(e) = window::setup_popover_window(app.handle()) {
                eprintln!("Failed to setup popover window: {}", e);
            }

            // Show window on startup
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::goals::get_goals,
            commands::goals::add_goal,
            commands::goals::toggle_goal_completion,
            commands::goals::update_goal,
            commands::goals::delete_goal,
            commands::settings::get_setting,
            commands::settings::set_setting,
            commands::settings::get_all_settings,
            commands::reflections::get_reflection,
            commands::reflections::save_reflection,
            commands::reflections::get_reflections_by_level,
            commands::periods::is_goal_in_period,
            commands::periods::get_period_start,
            commands::window::resize_window_from_top,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
