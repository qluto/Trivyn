use serde::{Deserialize, Serialize};

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub week_start: i32,
    pub language: String,
    pub floating_window_position: WindowPosition,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowPosition {
    pub x: f64,
    pub y: f64,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            week_start: 2, // Monday
            language: "system".to_string(),
            floating_window_position: WindowPosition { x: 0.0, y: 0.0 },
        }
    }
}
