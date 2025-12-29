export type GoalLevel = 'daily' | 'weekly' | 'monthly';

export interface Goal {
  id: string;
  title: string;
  level: GoalLevel;
  isCompleted: boolean;
  completedAt: number | null;
  createdAt: number;
  periodStart: number;
  parentGoalId: string | null;
  note: string | null;
}

export type AppLanguage = 'system' | 'en' | 'ja';
export type AppTheme = 'system' | 'light' | 'dark';

export interface WindowPosition {
  x: number;
  y: number;
}

export interface AppSettings {
  weekStart: number;
  language: AppLanguage;
  theme: AppTheme;
  floatingWindowPosition: WindowPosition;
}

export interface Reflection {
  id: number | null;
  level: GoalLevel;
  periodKey: string;
  insight1: string | null;
  insight2: string | null;
  insight3: string | null;
  createdAt: number;
}
