use anyhow::Result;
use rusqlite::params;
use crate::models::{Reflection, GoalLevel};
use crate::db::Database;

impl Database {
    /// Get reflection for a specific level and period
    pub fn get_reflection(&self, level: &str, period_key: &str) -> Result<Option<Reflection>> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = conn.prepare(
            "SELECT id, level, period_key, insight_1, insight_2, insight_3, created_at
             FROM reflections WHERE level = ? AND period_key = ?"
        )?;

        let result = stmt.query_row([level, period_key], |row| {
            Ok(Reflection {
                id: row.get(0)?,
                level: GoalLevel::from_str(&row.get::<_, String>(1)?)
                    .unwrap_or(GoalLevel::Daily),
                period_key: row.get(2)?,
                insight_1: row.get(3)?,
                insight_2: row.get(4)?,
                insight_3: row.get(5)?,
                created_at: row.get(6)?,
            })
        });

        match result {
            Ok(reflection) => Ok(Some(reflection)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    /// Save or update reflection
    pub fn save_reflection(&self, reflection: &Reflection) -> Result<Reflection> {
        let conn = self.conn.lock().unwrap();

        conn.execute(
            "INSERT INTO reflections (level, period_key, insight_1, insight_2, insight_3, created_at)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(level, period_key) DO UPDATE SET
                 insight_1 = excluded.insight_1,
                 insight_2 = excluded.insight_2,
                 insight_3 = excluded.insight_3",
            params![
                reflection.level.as_str(),
                reflection.period_key,
                reflection.insight_1,
                reflection.insight_2,
                reflection.insight_3,
                reflection.created_at,
            ],
        )?;

        let id = conn.last_insert_rowid();

        Ok(Reflection {
            id: Some(id),
            level: reflection.level.clone(),
            period_key: reflection.period_key.clone(),
            insight_1: reflection.insight_1.clone(),
            insight_2: reflection.insight_2.clone(),
            insight_3: reflection.insight_3.clone(),
            created_at: reflection.created_at,
        })
    }

    /// Get all reflections for a specific level
    pub fn get_reflections_by_level(&self, level: &str) -> Result<Vec<Reflection>> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = conn.prepare(
            "SELECT id, level, period_key, insight_1, insight_2, insight_3, created_at
             FROM reflections WHERE level = ? ORDER BY created_at DESC"
        )?;

        let rows = stmt.query_map([level], |row| {
            Ok(Reflection {
                id: row.get(0)?,
                level: GoalLevel::from_str(&row.get::<_, String>(1)?)
                    .unwrap_or(GoalLevel::Daily),
                period_key: row.get(2)?,
                insight_1: row.get(3)?,
                insight_2: row.get(4)?,
                insight_3: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;

        let mut reflections = Vec::new();
        for reflection in rows {
            reflections.push(reflection?);
        }

        Ok(reflections)
    }
}
