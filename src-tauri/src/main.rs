// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

mod models;
mod db;
mod commands;
mod tray;
mod window;
mod reflection_reminder;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_updater::Builder::new().build())
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

            // Initialize reflection reminder
            let db_state: tauri::State<db::Database> = app.state();
            let reminder = std::sync::Arc::new(reflection_reminder::ReflectionReminder::new(
                db_state.inner().clone(),
            ));

            // Run initial check
            let app_handle_clone = app.handle().clone();
            if let Err(e) = reminder.check_and_notify(&app_handle_clone) {
                eprintln!("Initial reflection check failed: {}", e);
            }

            // Start background checker
            let app_handle = app.handle().clone();
            let reminder_clone = reminder.clone();
            tauri::async_runtime::spawn(async move {
                reflection_reminder::background::start_background_checker(reminder_clone, app_handle).await;
            });

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
            commands::settings::set_language,
            commands::settings::set_theme,
            commands::settings::get_all_settings,
            commands::settings::enable_autostart,
            commands::settings::disable_autostart,
            commands::settings::is_autostart_enabled,
            commands::reflections::get_reflection,
            commands::reflections::save_reflection,
            commands::reflections::get_reflections_by_level,
            commands::periods::is_goal_in_period,
            commands::periods::get_period_start,
            commands::periods::get_week_key,
            commands::periods::get_month_key,
            commands::window::resize_window_from_top,
            commands::window::resize_popover,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
