use tauri::State;
use std::collections::HashMap;
use crate::db::Database;

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
pub async fn get_all_settings(
    db: State<'_, Database>,
) -> Result<HashMap<String, String>, String> {
    db.get_all_settings()
        .map_err(|e| e.to_string())
}
