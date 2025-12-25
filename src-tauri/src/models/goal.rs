use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Goal {
    pub id: String,
    pub title: String,
    pub level: GoalLevel,
    pub is_completed: bool,
    pub completed_at: Option<i64>,
    pub created_at: i64,
    pub period_start: i64,
    pub parent_goal_id: Option<String>,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum GoalLevel {
    Daily,
    Weekly,
    Monthly,
}

impl GoalLevel {
    pub fn as_str(&self) -> &str {
        match self {
            GoalLevel::Daily => "daily",
            GoalLevel::Weekly => "weekly",
            GoalLevel::Monthly => "monthly",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "daily" => Some(GoalLevel::Daily),
            "weekly" => Some(GoalLevel::Weekly),
            "monthly" => Some(GoalLevel::Monthly),
            _ => None,
        }
    }
}

impl Goal {
    pub fn new(title: String, level: GoalLevel, period_start: i64) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            title,
            level,
            is_completed: false,
            completed_at: None,
            created_at: chrono::Utc::now().timestamp_millis(),
            period_start,
            parent_goal_id: None,
            note: None,
        }
    }
}
