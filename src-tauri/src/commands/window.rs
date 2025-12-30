use tauri::{command, Window, LogicalSize, PhysicalPosition};

#[cfg(target_os = "windows")]
fn update_window_region(window: &Window) -> Result<(), String> {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::Graphics::Gdi::{CreateRoundRectRgn, SetWindowRgn};

    let hwnd = window.hwnd().map_err(|e| format!("Failed to get HWND: {}", e))?;
    let hwnd = HWND(hwnd.0 as _);
    let size = window.outer_size().map_err(|e| format!("Failed to get size: {}", e))?;

    unsafe {
        // Create rounded rectangle region (12px corner radius to match CSS)
        let region = CreateRoundRectRgn(0, 0, size.width as i32, size.height as i32, 24, 24);
        // Apply region to window
        SetWindowRgn(hwnd, region, true);
    }

    Ok(())
}

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

    // Update window region on Windows after resize
    #[cfg(target_os = "windows")]
    update_window_region(&window)?;

    Ok(())
}

#[command]
pub async fn resize_popover(window: Window, height: f64) -> Result<(), String> {
    // Get current position
    let current_pos = window
        .outer_position()
        .map_err(|e| format!("Failed to get position: {}", e))?;

    // Resize window (420px width for popover)
    window
        .set_size(LogicalSize::new(420.0, height))
        .map_err(|e| format!("Failed to resize window: {}", e))?;

    // Restore the top position
    window
        .set_position(PhysicalPosition::new(current_pos.x, current_pos.y))
        .map_err(|e| format!("Failed to set position: {}", e))?;

    // Update window region on Windows after resize
    #[cfg(target_os = "windows")]
    update_window_region(&window)?;

    Ok(())
}
