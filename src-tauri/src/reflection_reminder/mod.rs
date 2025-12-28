pub mod background;

use crate::db::Database;
use chrono::{DateTime, Datelike, Local};
use tauri::{AppHandle, Emitter, Manager};

#[derive(Debug, Clone, serde::Serialize)]
pub struct PeriodChangeEvent {
    pub has_weekly_change: bool,
    pub has_monthly_change: bool,
    pub current_week_key: String,
    pub current_month_key: String,
}

pub struct ReflectionReminder {
    db: Database,
}

impl ReflectionReminder {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    /// 期間変更をチェックし、必要に応じてイベントを発行
    pub fn check_and_notify(&self, app: &AppHandle) -> Result<(), String> {
        // 1. 設定チェック
        let enabled = self.is_enabled()?;
        if !enabled {
            return Ok(());
        }

        // 2. 最終チェック日時を取得
        let last_check = self.get_last_check_timestamp()?;
        let now = chrono::Utc::now().timestamp_millis();

        // 3. 週開始日を取得
        let week_start = self.get_week_start()?;

        // 4. 期間変更を検出
        let (has_weekly, has_monthly) = self.detect_period_change(last_check, now, week_start)?;

        // 5. 表示履歴チェック（同じ期間で既に表示済みなら無視）
        if has_weekly || has_monthly {
            let current_week_key = self.get_current_week_key(now, week_start)?;
            let current_month_key = self.get_current_month_key(now)?;

            let already_shown_weekly = self.has_shown_for_period("weekly", &current_week_key)?;
            let already_shown_monthly = self.has_shown_for_period("monthly", &current_month_key)?;

            let should_show_weekly = has_weekly && !already_shown_weekly;
            let should_show_monthly = has_monthly && !already_shown_monthly;

            if should_show_weekly || should_show_monthly {
                // 6. イベント発行
                let event = PeriodChangeEvent {
                    has_weekly_change: should_show_weekly,
                    has_monthly_change: should_show_monthly,
                    current_week_key: current_week_key.clone(),
                    current_month_key: current_month_key.clone(),
                };

                println!("[ReflectionReminder] Emitting reflection-prompt-trigger event: {:?}", event);

                app.emit("reflection-prompt-trigger", event)
                    .map_err(|e| format!("Failed to emit event: {}", e))?;

                // ポップオーバーウィンドウを表示
                if let Some(window) = app.get_webview_window("popover") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }

                // 7. 表示履歴を更新
                if should_show_weekly {
                    self.mark_shown("weekly", &current_week_key)?;
                }
                if should_show_monthly {
                    self.mark_shown("monthly", &current_month_key)?;
                }
            }
        }

        // 8. 最終チェック日時を更新
        self.update_last_check_timestamp(now)?;

        Ok(())
    }

    fn is_enabled(&self) -> Result<bool, String> {
        let conn = self.db.conn.lock().unwrap();
        let value: String = conn
            .query_row(
                "SELECT value FROM settings WHERE key = ?",
                ["reflection_prompt_enabled"],
                |row| row.get(0),
            )
            .map_err(|e| format!("Failed to get reflection_prompt_enabled: {}", e))?;

        Ok(value == "true")
    }

    fn get_last_check_timestamp(&self) -> Result<i64, String> {
        let conn = self.db.conn.lock().unwrap();
        let value: String = conn
            .query_row(
                "SELECT value FROM settings WHERE key = ?",
                ["last_period_check_timestamp"],
                |row| row.get(0),
            )
            .map_err(|e| format!("Failed to get last_period_check_timestamp: {}", e))?;

        value
            .parse()
            .map_err(|e| format!("Failed to parse last_period_check_timestamp: {}", e))
    }

    fn update_last_check_timestamp(&self, timestamp: i64) -> Result<(), String> {
        let conn = self.db.conn.lock().unwrap();
        conn.execute(
            "UPDATE settings SET value = ? WHERE key = ?",
            [timestamp.to_string(), "last_period_check_timestamp".to_string()],
        )
        .map_err(|e| format!("Failed to update last_period_check_timestamp: {}", e))?;

        Ok(())
    }

    fn get_week_start(&self) -> Result<i32, String> {
        let conn = self.db.conn.lock().unwrap();
        let value: String = conn
            .query_row(
                "SELECT value FROM settings WHERE key = ?",
                ["week_start"],
                |row| row.get(0),
            )
            .map_err(|e| format!("Failed to get week_start: {}", e))?;

        value
            .parse()
            .map_err(|e| format!("Failed to parse week_start: {}", e))
    }

    fn detect_period_change(
        &self,
        last_check: i64,
        now: i64,
        week_start: i32,
    ) -> Result<(bool, bool), String> {
        // If this is the first check (last_check == 0), don't trigger
        if last_check == 0 {
            return Ok((false, false));
        }

        let last_dt = DateTime::from_timestamp_millis(last_check)
            .ok_or("Invalid last_check timestamp")?
            .with_timezone(&Local);

        let now_dt = DateTime::from_timestamp_millis(now)
            .ok_or("Invalid now timestamp")?
            .with_timezone(&Local);

        // Check if week changed
        let has_weekly_change = !self.is_same_week(&last_dt, &now_dt, week_start);

        // Check if month changed
        let has_monthly_change = !self.is_same_month(&last_dt, &now_dt);

        Ok((has_weekly_change, has_monthly_change))
    }

    fn is_same_week(&self, dt1: &DateTime<Local>, dt2: &DateTime<Local>, week_start: i32) -> bool {
        let week1_start = self.get_week_start_dt(dt1, week_start);
        let week2_start = self.get_week_start_dt(dt2, week_start);
        self.is_same_day(&week1_start, &week2_start)
    }

    fn is_same_day(&self, dt1: &DateTime<Local>, dt2: &DateTime<Local>) -> bool {
        dt1.year() == dt2.year() && dt1.ordinal() == dt2.ordinal()
    }

    fn is_same_month(&self, dt1: &DateTime<Local>, dt2: &DateTime<Local>) -> bool {
        dt1.year() == dt2.year() && dt1.month() == dt2.month()
    }

    fn get_week_start_dt(&self, dt: &DateTime<Local>, week_start: i32) -> DateTime<Local> {
        let current_weekday = dt.weekday().num_days_from_sunday() as i32;
        let target_weekday = (week_start - 1) % 7;
        let days_diff = (current_weekday - target_weekday + 7) % 7;
        let week_start_date = dt.date_naive() - chrono::Duration::days(days_diff as i64);

        week_start_date
            .and_hms_opt(0, 0, 0)
            .unwrap()
            .and_local_timezone(Local)
            .unwrap()
    }

    fn get_current_week_key(&self, timestamp: i64, week_start: i32) -> Result<String, String> {
        let dt = DateTime::from_timestamp_millis(timestamp)
            .ok_or("Invalid timestamp")?
            .with_timezone(&Local);

        let week_start_dt = self.get_week_start_dt(&dt, week_start);
        let iso_week = week_start_dt.iso_week();

        Ok(format!("{}-W{:02}", iso_week.year(), iso_week.week()))
    }

    fn get_current_month_key(&self, timestamp: i64) -> Result<String, String> {
        let dt = DateTime::from_timestamp_millis(timestamp)
            .ok_or("Invalid timestamp")?
            .with_timezone(&Local);

        Ok(format!("{}-{:02}", dt.year(), dt.month()))
    }

    fn has_shown_for_period(&self, level: &str, period_key: &str) -> Result<bool, String> {
        let conn = self.db.conn.lock().unwrap();
        let key = match level {
            "weekly" => "last_weekly_reflection_prompt",
            "monthly" => "last_monthly_reflection_prompt",
            _ => return Err(format!("Invalid level: {}", level)),
        };

        let value: String = conn
            .query_row("SELECT value FROM settings WHERE key = ?", [key], |row| {
                row.get(0)
            })
            .map_err(|e| format!("Failed to get {}: {}", key, e))?;

        Ok(value == period_key)
    }

    fn mark_shown(&self, level: &str, period_key: &str) -> Result<(), String> {
        let conn = self.db.conn.lock().unwrap();
        let key = match level {
            "weekly" => "last_weekly_reflection_prompt",
            "monthly" => "last_monthly_reflection_prompt",
            _ => return Err(format!("Invalid level: {}", level)),
        };

        conn.execute(
            "UPDATE settings SET value = ? WHERE key = ?",
            [period_key, key],
        )
        .map_err(|e| format!("Failed to update {}: {}", key, e))?;

        Ok(())
    }
}
