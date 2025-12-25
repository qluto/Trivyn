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

export interface WindowPosition {
  x: number;
  y: number;
}

export interface AppSettings {
  weekStart: number;
  language: AppLanguage;
  floatingWindowPosition: WindowPosition;
}

export interface Reflection {
  id: number;
  level: 'weekly' | 'monthly';
  periodKey: string;
  insights: string[];
  createdAt: number;
}
