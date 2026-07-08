import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { Goal, GoalLevel } from '../types';
import { addPeriods, getParentLevel } from '../utils/periods';

// Period filtering helper functions
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isSameWeek(date1: Date, date2: Date, weekStart: number): boolean {
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // weekStart: 1 = Sunday (0), 2 = Monday (1), ..., 7 = Saturday (6)
    const targetDay = (weekStart - 1) % 7;
    const diff = (day - targetDay + 7) % 7;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const week1Start = getWeekStart(date1);
  const week2Start = getWeekStart(date2);
  return isSameDay(week1Start, week2Start);
}

function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

interface GoalStore {
  goals: Goal[];
  selectedLevel: GoalLevel;
  loading: boolean;
  error: string | null;
  weekStart: number; // Week start day setting

  // Actions
  loadGoals: () => Promise<void>;
  addGoal: (title: string, level: GoalLevel, parentGoalId?: string | null) => Promise<void>;
  carryOverGoal: (goal: Goal) => Promise<void>;
  toggleGoalCompletion: (goalId: string) => Promise<Goal>;
  updateGoal: (goalId: string, title: string) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  setSelectedLevel: (level: GoalLevel) => void;
  setWeekStart: (weekStart: number) => void;
  setupEventListeners: () => Promise<UnlistenFn>;

  // Computed
  getDailyGoals: () => Goal[];
  getWeeklyGoals: () => Goal[];
  getMonthlyGoals: () => Goal[];
  getCurrentGoals: () => Goal[];
  getGoalsForPeriod: (level: GoalLevel, targetDate: Date) => Goal[];
  getParentGoals: (level: GoalLevel) => Goal[];
  getChildStats: (goalId: string) => { completed: number; total: number } | null;
  getPreviousPeriodUnfinished: (level: GoalLevel) => Goal[];
  canAddGoal: (level: GoalLevel) => boolean;
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [],
  selectedLevel: 'daily',
  loading: false,
  error: null,
  weekStart: 2, // Default to Monday, will be updated from settings

  loadGoals: async () => {
    console.log('[goalStore] loadGoals called');
    set({ loading: true, error: null });
    try {
      const goals = await invoke<Goal[]>('get_goals', {});
      console.log('[goalStore] Goals loaded from backend:', goals.length, 'goals');
      set({ goals, loading: false });
    } catch (error) {
      console.error('[goalStore] Error loading goals:', error);
      set({ error: String(error), loading: false });
    }
  },

  addGoal: async (title: string, level: GoalLevel, parentGoalId?: string | null) => {
    try {
      const periodStart = Date.now();
      const newGoal = await invoke<Goal>('add_goal', {
        title,
        level,
        periodStart,
        parentGoalId: parentGoalId ?? null
      });
      set((state) => ({ goals: [...state.goals, newGoal] }));
      // Event is emitted from Rust backend
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  carryOverGoal: async (goal: Goal) => {
    // 親目標の期間がまだ現在進行中の場合のみリンクを引き継ぐ
    let parentGoalId: string | null = null;
    if (goal.parentGoalId) {
      const parent = get().goals.find((g) => g.id === goal.parentGoalId);
      if (
        parent &&
        get().getGoalsForPeriod(parent.level, new Date()).some((g) => g.id === parent.id)
      ) {
        parentGoalId = parent.id;
      }
    }
    await get().addGoal(goal.title, goal.level, parentGoalId);
  },

  toggleGoalCompletion: async (goalId: string) => {
    try {
      console.log('[goalStore] Toggling goal completion for:', goalId);
      const updatedGoal = await invoke<Goal>('toggle_goal_completion', { goalId });
      console.log('[goalStore] Goal toggled, updated goal:', updatedGoal);
      set((state) => ({
        goals: state.goals.map((g) => (g.id === goalId ? updatedGoal : g)),
      }));
      console.log('[goalStore] Local state updated, Rust backend will emit goals-updated event');
      // Event is emitted from Rust backend
      return updatedGoal;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  updateGoal: async (goalId: string, title: string) => {
    try {
      await invoke('update_goal', { goalId, title });
      set((state) => ({
        goals: state.goals.map((g) =>
          g.id === goalId ? { ...g, title } : g
        ),
      }));
      // Event is emitted from Rust backend
    } catch (error) {
      set({ error: String(error) });
    }
  },

  deleteGoal: async (goalId: string) => {
    try {
      await invoke('delete_goal', { goalId });
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== goalId),
      }));
      // Event is emitted from Rust backend
    } catch (error) {
      set({ error: String(error) });
    }
  },

  setSelectedLevel: (level: GoalLevel) => {
    set({ selectedLevel: level });
  },

  setWeekStart: (weekStart: number) => {
    set({ weekStart });
  },

  getDailyGoals: () => {
    const { goals } = get();
    const now = new Date();
    return goals.filter((g) => {
      if (g.level !== 'daily') return false;
      const goalDate = new Date(g.periodStart);
      return isSameDay(goalDate, now);
    });
  },

  getWeeklyGoals: () => {
    const { goals, weekStart } = get();
    const now = new Date();
    return goals.filter((g) => {
      if (g.level !== 'weekly') return false;
      const goalDate = new Date(g.periodStart);
      return isSameWeek(goalDate, now, weekStart);
    });
  },

  getMonthlyGoals: () => {
    const { goals } = get();
    const now = new Date();
    return goals.filter((g) => {
      if (g.level !== 'monthly') return false;
      const goalDate = new Date(g.periodStart);
      return isSameMonth(goalDate, now);
    });
  },

  getCurrentGoals: () => {
    const { selectedLevel } = get();
    switch (selectedLevel) {
      case 'daily':
        return get().getDailyGoals();
      case 'weekly':
        return get().getWeeklyGoals();
      case 'monthly':
        return get().getMonthlyGoals();
    }
  },

  getGoalsForPeriod: (level: GoalLevel, targetDate: Date) => {
    const { goals, weekStart } = get();
    return goals.filter((g) => {
      if (g.level !== level) return false;
      const goalDate = new Date(g.periodStart);
      switch (level) {
        case 'daily':
          return isSameDay(goalDate, targetDate);
        case 'weekly':
          return isSameWeek(goalDate, targetDate, weekStart);
        case 'monthly':
          return isSameMonth(goalDate, targetDate);
      }
    });
  },

  getParentGoals: (level: GoalLevel) => {
    const parentLevel = getParentLevel(level);
    if (!parentLevel) return [];
    return get().getGoalsForPeriod(parentLevel, new Date());
  },

  getChildStats: (goalId: string) => {
    // リンクは現在期間の親に対してのみ作成されるため、children は親の期間内の
    // 下位目標の累計になる（例: 週目標には週内の各日の日次目標が積み上がり、
    // 2/5 のような 3 を超える合計は意図した表示）
    const children = get().goals.filter((g) => g.parentGoalId === goalId);
    if (children.length === 0) return null;
    return {
      completed: children.filter((c) => c.isCompleted).length,
      total: children.length,
    };
  },

  getPreviousPeriodUnfinished: (level: GoalLevel) => {
    const previousDate = addPeriods(level, new Date(), -1);
    return get()
      .getGoalsForPeriod(level, previousDate)
      .filter((g) => !g.isCompleted);
  },

  canAddGoal: (level: GoalLevel) => {
    const levelGoals = level === 'daily' ? get().getDailyGoals()
      : level === 'weekly' ? get().getWeeklyGoals()
      : get().getMonthlyGoals();
    return levelGoals.length < 3;
  },

  setupEventListeners: async () => {
    // Listen for goals-updated events from other windows
    console.log('[goalStore] Setting up goals-updated event listener');
    const unlisten = await listen('goals-updated', async () => {
      console.log('[goalStore] Received goals-updated event, reloading goals...');
      // Reload goals from backend
      await get().loadGoals();
    });
    return unlisten;
  },
}));
