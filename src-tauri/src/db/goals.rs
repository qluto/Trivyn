use anyhow::Result;
use rusqlite::params;
use crate::models::{Goal, GoalLevel};
use crate::db::Database;

impl Database {
    pub fn get_goals(&self, level: Option<&str>) -> Result<Vec<Goal>> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = if let Some(level) = level {
            let mut stmt = conn.prepare(
                "SELECT id, title, level, is_completed, completed_at, created_at, period_start, parent_goal_id, note
                 FROM goals WHERE level = ? ORDER BY created_at ASC"
            )?;
            let rows = stmt.query_map([level], |row| {
                Ok(Goal {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    level: GoalLevel::from_str(&row.get::<_, String>(2)?)
                        .unwrap_or(GoalLevel::Daily),
                    is_completed: row.get::<_, i32>(3)? != 0,
                    completed_at: row.get(4)?,
                    created_at: row.get(5)?,
                    period_start: row.get(6)?,
                    parent_goal_id: row.get(7)?,
                    note: row.get(8)?,
                })
            })?;

            let mut goals = Vec::new();
            for goal in rows {
                goals.push(goal?);
            }
            return Ok(goals);
        } else {
            conn.prepare(
                "SELECT id, title, level, is_completed, completed_at, created_at, period_start, parent_goal_id, note
                 FROM goals ORDER BY created_at ASC"
            )?
        };

        let rows = stmt.query_map([], |row| {
            Ok(Goal {
                id: row.get(0)?,
                title: row.get(1)?,
                level: GoalLevel::from_str(&row.get::<_, String>(2)?)
                    .unwrap_or(GoalLevel::Daily),
                is_completed: row.get::<_, i32>(3)? != 0,
                completed_at: row.get(4)?,
                created_at: row.get(5)?,
                period_start: row.get(6)?,
                parent_goal_id: row.get(7)?,
                note: row.get(8)?,
            })
        })?;

        let mut goals = Vec::new();
        for goal in rows {
            goals.push(goal?);
        }
        Ok(goals)
    }

    pub fn add_goal(&self, goal: &Goal) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO goals (id, title, level, is_completed, completed_at, created_at, period_start, parent_goal_id, note)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                &goal.id,
                &goal.title,
                goal.level.as_str(),
                goal.is_completed as i32,
                goal.completed_at,
                goal.created_at,
                goal.period_start,
                &goal.parent_goal_id,
                &goal.note,
            ],
        )?;
        Ok(())
    }

    pub fn update_goal(&self, id: &str, title: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE goals SET title = ? WHERE id = ?",
            params![title, id],
        )?;
        Ok(())
    }

    pub fn toggle_goal_completion(&self, id: &str) -> Result<Goal> {
        let conn = self.conn.lock().unwrap();

        // Get current state
        let mut stmt = conn.prepare(
            "SELECT is_completed FROM goals WHERE id = ?"
        )?;
        let is_completed: i32 = stmt.query_row([id], |row| row.get(0))?;

        let new_completed = is_completed == 0;
        let completed_at = if new_completed {
            Some(chrono::Utc::now().timestamp_millis())
        } else {
            None
        };

        conn.execute(
            "UPDATE goals SET is_completed = ?, completed_at = ? WHERE id = ?",
            params![new_completed as i32, completed_at, id],
        )?;

        // Return updated goal
        let mut stmt = conn.prepare(
            "SELECT id, title, level, is_completed, completed_at, created_at, period_start, parent_goal_id, note
             FROM goals WHERE id = ?"
        )?;

        let goal = stmt.query_row([id], |row| {
            Ok(Goal {
                id: row.get(0)?,
                title: row.get(1)?,
                level: GoalLevel::from_str(&row.get::<_, String>(2)?)
                    .unwrap_or(GoalLevel::Daily),
                is_completed: row.get::<_, i32>(3)? != 0,
                completed_at: row.get(4)?,
                created_at: row.get(5)?,
                period_start: row.get(6)?,
                parent_goal_id: row.get(7)?,
                note: row.get(8)?,
            })
        })?;

        Ok(goal)
    }

    pub fn delete_goal(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM goals WHERE id = ?", params![id])?;
        Ok(())
    }
}
