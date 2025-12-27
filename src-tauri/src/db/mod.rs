use anyhow::Result;
use rusqlite::{Connection, params};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

pub mod goals;
pub mod settings;
pub mod reflections;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(path: PathBuf) -> Result<Self> {
        let conn = Connection::open(path)?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }
}

pub async fn init_database(app: &AppHandle) -> Result<()> {
    let app_dir = app.path().app_data_dir()
        .expect("Failed to get app data directory");

    if !app_dir.exists() {
        std::fs::create_dir_all(&app_dir)?;
    }

    let db_path = app_dir.join("tria.db");
    let db = Database::new(db_path)?;

    // Run migrations
    let conn = db.conn.lock().unwrap();

    // Create goals table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS goals (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            level TEXT NOT NULL,
            is_completed INTEGER NOT NULL DEFAULT 0,
            completed_at INTEGER,
            created_at INTEGER NOT NULL,
            period_start INTEGER NOT NULL,
            parent_goal_id TEXT,
            note TEXT,
            FOREIGN KEY (parent_goal_id) REFERENCES goals(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_goals_level ON goals(level)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_goals_period_start ON goals(period_start)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_goals_is_completed ON goals(is_completed)",
        [],
    )?;

    // Create settings table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )?;

    // Insert default settings
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
        params!["week_start", "2"],
    )?;
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
        params!["language", "system"],
    )?;
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
        params!["floating_window_position", r#"{"x": 0.0, "y": 0.0}"#],
    )?;
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
        params!["last_weekly_reminder", "0"],
    )?;
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
        params!["last_monthly_reminder", "0"],
    )?;
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
        params!["last_weekly_reflection", "0"],
    )?;
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
        params!["last_monthly_reflection", "0"],
    )?;

    // Create reflections table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS reflections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            level TEXT NOT NULL,
            period_key TEXT NOT NULL,
            insight_1 TEXT,
            insight_2 TEXT,
            insight_3 TEXT,
            created_at INTEGER NOT NULL,
            UNIQUE(level, period_key)
        )",
        [],
    )?;

    drop(conn);

    // Store database in app state
    app.manage(db);

    Ok(())
}
