use chrono::{DateTime, Datelike, Duration, Local, NaiveDate};

/// Check if a goal is in the same period as the target date
#[tauri::command]
pub fn is_goal_in_period(
    goal_period_start: i64,
    level: String,
    target_date: i64,
    week_start: i32,
) -> Result<bool, String> {
    let goal_dt = DateTime::from_timestamp_millis(goal_period_start)
        .ok_or("Invalid goal_period_start timestamp")?
        .with_timezone(&Local);

    let target_dt = DateTime::from_timestamp_millis(target_date)
        .ok_or("Invalid target_date timestamp")?
        .with_timezone(&Local);

    match level.as_str() {
        "daily" => Ok(is_same_day(&goal_dt, &target_dt)),
        "weekly" => Ok(is_same_week(&goal_dt, &target_dt, week_start)),
        "monthly" => Ok(is_same_month(&goal_dt, &target_dt)),
        _ => Err(format!("Invalid level: {}", level)),
    }
}

/// Get the period start timestamp for a given date and level
#[tauri::command]
pub fn get_period_start(date: i64, level: String, week_start: i32) -> Result<i64, String> {
    let dt = DateTime::from_timestamp_millis(date)
        .ok_or("Invalid date timestamp")?
        .with_timezone(&Local);

    let period_start = match level.as_str() {
        "daily" => get_day_start(&dt),
        "weekly" => get_week_start(&dt, week_start),
        "monthly" => get_month_start(&dt),
        _ => return Err(format!("Invalid level: {}", level)),
    };

    Ok(period_start.timestamp_millis())
}

fn is_same_day(dt1: &DateTime<Local>, dt2: &DateTime<Local>) -> bool {
    dt1.year() == dt2.year() && dt1.ordinal() == dt2.ordinal()
}

fn is_same_week(dt1: &DateTime<Local>, dt2: &DateTime<Local>, week_start: i32) -> bool {
    let week1_start = get_week_start(dt1, week_start);
    let week2_start = get_week_start(dt2, week_start);
    is_same_day(&week1_start, &week2_start)
}

fn is_same_month(dt1: &DateTime<Local>, dt2: &DateTime<Local>) -> bool {
    dt1.year() == dt2.year() && dt1.month() == dt2.month()
}

fn get_day_start(dt: &DateTime<Local>) -> DateTime<Local> {
    dt.date_naive()
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_local_timezone(Local)
        .unwrap()
}

fn get_week_start(dt: &DateTime<Local>, week_start: i32) -> DateTime<Local> {
    let current_weekday = dt.weekday().num_days_from_sunday() as i32;
    // week_start: 1 = Sunday (0), 2 = Monday (1), ..., 7 = Saturday (6)
    let target_weekday = (week_start - 1) % 7;

    let days_diff = (current_weekday - target_weekday + 7) % 7;
    let week_start_date = dt.date_naive() - Duration::days(days_diff as i64);

    week_start_date
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_local_timezone(Local)
        .unwrap()
}

fn get_month_start(dt: &DateTime<Local>) -> DateTime<Local> {
    let month_start_date = NaiveDate::from_ymd_opt(dt.year(), dt.month(), 1).unwrap();
    month_start_date
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_local_timezone(Local)
        .unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{TimeZone, Timelike};

    #[test]
    fn test_is_same_day() {
        let dt1 = Local.with_ymd_and_hms(2025, 12, 27, 10, 0, 0).unwrap();
        let dt2 = Local.with_ymd_and_hms(2025, 12, 27, 15, 30, 0).unwrap();
        let dt3 = Local.with_ymd_and_hms(2025, 12, 28, 10, 0, 0).unwrap();

        assert!(is_same_day(&dt1, &dt2));
        assert!(!is_same_day(&dt1, &dt3));
    }

    #[test]
    fn test_is_same_week() {
        // Week starting on Monday (week_start = 2)
        let monday = Local.with_ymd_and_hms(2025, 12, 22, 10, 0, 0).unwrap(); // Monday
        let friday = Local.with_ymd_and_hms(2025, 12, 26, 10, 0, 0).unwrap(); // Friday
        let next_monday = Local.with_ymd_and_hms(2025, 12, 29, 10, 0, 0).unwrap(); // Next Monday

        assert!(is_same_week(&monday, &friday, 2));
        assert!(!is_same_week(&monday, &next_monday, 2));
    }

    #[test]
    fn test_is_same_month() {
        let dt1 = Local.with_ymd_and_hms(2025, 12, 1, 10, 0, 0).unwrap();
        let dt2 = Local.with_ymd_and_hms(2025, 12, 31, 15, 30, 0).unwrap();
        let dt3 = Local.with_ymd_and_hms(2026, 1, 1, 10, 0, 0).unwrap();

        assert!(is_same_month(&dt1, &dt2));
        assert!(!is_same_month(&dt1, &dt3));
    }

    #[test]
    fn test_get_week_start_monday() {
        // December 26, 2025 is a Friday
        let friday = Local.with_ymd_and_hms(2025, 12, 26, 15, 30, 0).unwrap();
        let week_start = get_week_start(&friday, 2); // Monday

        // Should be December 22, 2025 (Monday)
        assert_eq!(week_start.year(), 2025);
        assert_eq!(week_start.month(), 12);
        assert_eq!(week_start.day(), 22);
        assert_eq!(week_start.hour(), 0);
        assert_eq!(week_start.minute(), 0);
        assert_eq!(week_start.second(), 0);
    }

    #[test]
    fn test_get_week_start_all_days() {
        // December 26, 2025 is a Friday
        let friday = Local.with_ymd_and_hms(2025, 12, 26, 15, 30, 0).unwrap();

        // Test all week start days
        let tests = vec![
            (1, 21), // Sunday -> Dec 21 (Sunday)
            (2, 22), // Monday -> Dec 22 (Monday)
            (3, 23), // Tuesday -> Dec 23 (Tuesday)
            (4, 24), // Wednesday -> Dec 24 (Wednesday)
            (5, 25), // Thursday -> Dec 25 (Thursday)
            (6, 26), // Friday -> Dec 26 (Friday, same day)
            (7, 20), // Saturday -> Dec 20 (Saturday)
        ];

        for (week_start, expected_day) in tests {
            let week_start_dt = get_week_start(&friday, week_start);
            assert_eq!(week_start_dt.day(), expected_day, "week_start={}", week_start);
            assert_eq!(week_start_dt.month(), 12);
            assert_eq!(week_start_dt.year(), 2025);
        }
    }

    #[test]
    fn test_get_month_start() {
        let dt = Local.with_ymd_and_hms(2025, 12, 27, 15, 30, 0).unwrap();
        let month_start = get_month_start(&dt);

        assert_eq!(month_start.year(), 2025);
        assert_eq!(month_start.month(), 12);
        assert_eq!(month_start.day(), 1);
        assert_eq!(month_start.hour(), 0);
        assert_eq!(month_start.minute(), 0);
        assert_eq!(month_start.second(), 0);
    }
}
