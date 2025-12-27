use tauri::{command, Window, LogicalSize, PhysicalPosition};

#[command]
pub async fn resize_window_from_top(window: Window, new_height: f64) -> Result<(), String> {
    // Get current position (returns PhysicalPosition)
    let current_pos = window
        .outer_position()
        .map_err(|e| format!("Failed to get position: {}", e))?;

    // Resize window to new height, keeping width the same
    window
        .set_size(LogicalSize::new(220.0, new_height))
        .map_err(|e| format!("Failed to resize window: {}", e))?;

    // Restore the top position using the same physical position
    window
        .set_position(PhysicalPosition::new(current_pos.x, current_pos.y))
        .map_err(|e| format!("Failed to set position: {}", e))?;

    Ok(())
}
