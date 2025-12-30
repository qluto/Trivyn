use tauri::{State, AppHandle, Emitter};
use tauri_plugin_autostart::ManagerExt;
use std::collections::HashMap;
use serde::Serialize;
use crate::db::Database;
use crate::tray;

#[derive(Clone, Serialize)]
struct LanguageChangedPayload {
    language: String,
    i18n_language: String,
}

#[derive(Clone, Serialize)]
struct ThemeChangedPayload {
    theme: String,
}

#[tauri::command]
pub async fn get_setting(
    key: String,
    db: State<'_, Database>,
) -> Result<String, String> {
    db.get_setting(&key)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_setting(
    key: String,
    value: String,
    db: State<'_, Database>,
) -> Result<(), String> {
    db.set_setting(&key, &value)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_language(
    language: String,
    i18n_language: String,
    app: AppHandle,
    db: State<'_, Database>,
) -> Result<(), String> {
    // Save language setting to database
    db.set_setting("language", &language)
        .map_err(|e| e.to_string())?;

    // Update tray menu with new language
    tray::update_tray_menu(&app, &i18n_language)
        .map_err(|e| e.to_string())?;

    // Emit event to all windows
    app.emit("language-changed", LanguageChangedPayload {
        language,
        i18n_language,
    }).map_err(|e: tauri::Error| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_all_settings(
    db: State<'_, Database>,
) -> Result<HashMap<String, String>, String> {
    db.get_all_settings()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_theme(
    theme: String,
    app: AppHandle,
    db: State<'_, Database>,
) -> Result<(), String> {
    // Save theme setting to database
    db.set_setting("theme", &theme)
        .map_err(|e| e.to_string())?;

    // Emit event to all windows
    app.emit("theme-changed", ThemeChangedPayload {
        theme,
    }).map_err(|e: tauri::Error| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn enable_autostart(
    app: AppHandle,
    db: State<'_, Database>,
) -> Result<(), String> {
    let autostart_manager = app.autolaunch();
    autostart_manager
        .enable()
        .map_err(|e| e.to_string())?;

    // Save setting to database
    db.set_setting("autostart_enabled", "true")
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn disable_autostart(
    app: AppHandle,
    db: State<'_, Database>,
) -> Result<(), String> {
    let autostart_manager = app.autolaunch();
    autostart_manager
        .disable()
        .map_err(|e| e.to_string())?;

    // Save setting to database
    db.set_setting("autostart_enabled", "false")
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn is_autostart_enabled(app: AppHandle) -> Result<bool, String> {
    let autostart_manager = app.autolaunch();
    autostart_manager
        .is_enabled()
        .map_err(|e| e.to_string())
}
