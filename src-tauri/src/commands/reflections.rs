use tauri::State;
use crate::db::Database;
use crate::models::{Reflection, GoalLevel};

#[tauri::command]
pub async fn get_reflection(
    level: String,
    period_key: String,
    db: State<'_, Database>,
) -> Result<Option<Reflection>, String> {
    db.get_reflection(&level, &period_key)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_reflection(
    level: String,
    period_key: String,
    insight_1: Option<String>,
    insight_2: Option<String>,
    insight_3: Option<String>,
    db: State<'_, Database>,
) -> Result<Reflection, String> {
    let level_enum = GoalLevel::from_str(&level)
        .ok_or_else(|| "Invalid level".to_string())?;

    let reflection = Reflection::new(
        level_enum,
        period_key,
        insight_1,
        insight_2,
        insight_3,
    );

    db.save_reflection(&reflection)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_reflections_by_level(
    level: String,
    db: State<'_, Database>,
) -> Result<Vec<Reflection>, String> {
    db.get_reflections_by_level(&level)
        .map_err(|e| e.to_string())
}
