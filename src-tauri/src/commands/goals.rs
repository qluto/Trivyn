use tauri::{State, AppHandle, Emitter};
use crate::db::Database;
use crate::models::{Goal, GoalLevel};

#[tauri::command]
pub async fn get_goals(
    level: Option<String>,
    db: State<'_, Database>,
) -> Result<Vec<Goal>, String> {
    db.get_goals(level.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_goal(
    title: String,
    level: String,
    period_start: i64,
    app: AppHandle,
    db: State<'_, Database>,
) -> Result<Goal, String> {
    let goal_level = GoalLevel::from_str(&level)
        .ok_or_else(|| "Invalid goal level".to_string())?;

    // Check if we already have 3 goals for this level in the current period
    let existing_goals = db.get_goals(Some(&level))
        .map_err(|e| e.to_string())?;

    // TODO: Filter by period (need period calculation logic)
    if existing_goals.len() >= 3 {
        return Err("Maximum 3 goals per level".to_string());
    }

    let goal = Goal::new(title, goal_level, period_start);
    db.add_goal(&goal)
        .map_err(|e| e.to_string())?;

    // Broadcast event to all windows
    let _ = app.emit("goals-updated", ());

    Ok(goal)
}

#[tauri::command]
pub async fn toggle_goal_completion(
    goal_id: String,
    app: AppHandle,
    db: State<'_, Database>,
) -> Result<Goal, String> {
    let goal = db.toggle_goal_completion(&goal_id)
        .map_err(|e| e.to_string())?;

    // Broadcast event to all windows
    let _ = app.emit("goals-updated", ());

    Ok(goal)
}

#[tauri::command]
pub async fn update_goal(
    goal_id: String,
    title: String,
    app: AppHandle,
    db: State<'_, Database>,
) -> Result<(), String> {
    db.update_goal(&goal_id, &title)
        .map_err(|e| e.to_string())?;

    // Broadcast event to all windows
    let _ = app.emit("goals-updated", ());

    Ok(())
}

#[tauri::command]
pub async fn delete_goal(
    goal_id: String,
    app: AppHandle,
    db: State<'_, Database>,
) -> Result<(), String> {
    db.delete_goal(&goal_id)
        .map_err(|e| e.to_string())?;

    // Broadcast event to all windows
    let _ = app.emit("goals-updated", ());

    Ok(())
}
