use serde::{Deserialize, Serialize};
use crate::models::GoalLevel;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Reflection {
    pub id: Option<i64>,
    pub level: GoalLevel,
    pub period_key: String,
    pub insight_1: Option<String>,
    pub insight_2: Option<String>,
    pub insight_3: Option<String>,
    pub created_at: i64,
}

impl Reflection {
    pub fn new(
        level: GoalLevel,
        period_key: String,
        insight_1: Option<String>,
        insight_2: Option<String>,
        insight_3: Option<String>,
    ) -> Self {
        Self {
            id: None,
            level,
            period_key,
            insight_1,
            insight_2,
            insight_3,
            created_at: chrono::Utc::now().timestamp_millis(),
        }
    }
}
