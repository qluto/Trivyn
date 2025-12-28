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

#[command]
pub async fn resize_popover(window: Window, height: f64) -> Result<(), String> {
    println!("[resize_popover] Starting resize to height: {}", height);

    // Get current position
    let current_pos = window
        .outer_position()
        .map_err(|e| format!("Failed to get position: {}", e))?;
    println!("[resize_popover] Current position: ({}, {})", current_pos.x, current_pos.y);

    // Get current size
    let current_size = window.outer_size().map_err(|e| format!("Failed to get size: {}", e))?;
    println!("[resize_popover] Current size: {}x{}", current_size.width, current_size.height);

    // Resize window (420px width for popover)
    window
        .set_size(LogicalSize::new(420.0, height))
        .map_err(|e| format!("Failed to resize window: {}", e))?;
    println!("[resize_popover] Set new size: 420x{}", height);

    // Restore the top position
    window
        .set_position(PhysicalPosition::new(current_pos.x, current_pos.y))
        .map_err(|e| format!("Failed to set position: {}", e))?;
    println!("[resize_popover] Restored position: ({}, {})", current_pos.x, current_pos.y);

    Ok(())
}
