use tauri::{State, AppHandle, Emitter, Manager};
use crate::db::Database;
use crate::models::{Goal, GoalLevel};
use chrono::{DateTime, Local};

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

    // Get week_start setting for period calculations
    let week_start = db.get_setting("week_start")
        .ok()
        .and_then(|v| v.parse::<i32>().ok())
        .unwrap_or(2); // Default to Monday

    // Check if we already have 3 goals for this level in the current period
    let existing_goals = db.get_goals(Some(&level))
        .map_err(|e| e.to_string())?;

    // Filter goals by current period
    let now = Local::now();
    let current_period_goals: Vec<&Goal> = existing_goals.iter()
        .filter(|goal| {
            let goal_dt = DateTime::from_timestamp_millis(goal.period_start)
                .map(|dt| dt.with_timezone(&Local))
                .unwrap_or_else(|| now);

            match goal_level {
                GoalLevel::Daily => crate::commands::periods::is_same_day(&goal_dt, &now),
                GoalLevel::Weekly => crate::commands::periods::is_same_week(&goal_dt, &now, week_start),
                GoalLevel::Monthly => crate::commands::periods::is_same_month(&goal_dt, &now),
            }
        })
        .collect();

    if current_period_goals.len() >= 3 {
        return Err("Maximum 3 goals per level".to_string());
    }

    let goal = Goal::new(title, goal_level, period_start);
    db.add_goal(&goal)
        .map_err(|e| e.to_string())?;

    // Broadcast event to all windows explicitly
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.emit("goals-updated", ());
    }
    if let Some(popover_window) = app.get_webview_window("popover") {
        let _ = popover_window.emit("goals-updated", ());
    }

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

    // Broadcast event to all windows explicitly
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.emit("goals-updated", ());
    }

    if let Some(popover_window) = app.get_webview_window("popover") {
        let _ = popover_window.emit("goals-updated", ());
    }

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

    // Broadcast event to all windows explicitly
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.emit("goals-updated", ());
    }
    if let Some(popover_window) = app.get_webview_window("popover") {
        let _ = popover_window.emit("goals-updated", ());
    }

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

    // Broadcast event to all windows explicitly
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.emit("goals-updated", ());
    }
    if let Some(popover_window) = app.get_webview_window("popover") {
        let _ = popover_window.emit("goals-updated", ());
    }

    Ok(())
}
