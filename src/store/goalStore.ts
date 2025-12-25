import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { Goal, GoalLevel } from '../types';

interface GoalStore {
  goals: Goal[];
  selectedLevel: GoalLevel;
  loading: boolean;
  error: string | null;

  // Actions
  loadGoals: () => Promise<void>;
  addGoal: (title: string, level: GoalLevel) => Promise<void>;
  toggleGoalCompletion: (goalId: string) => Promise<void>;
  updateGoal: (goalId: string, title: string) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  setSelectedLevel: (level: GoalLevel) => void;

  // Computed
  getDailyGoals: () => Goal[];
  getWeeklyGoals: () => Goal[];
  getMonthlyGoals: () => Goal[];
  getCurrentGoals: () => Goal[];
  canAddGoal: (level: GoalLevel) => boolean;
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [],
  selectedLevel: 'daily',
  loading: false,
  error: null,

  loadGoals: async () => {
    set({ loading: true, error: null });
    try {
      const goals = await invoke<Goal[]>('get_goals', {});
      set({ goals, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  addGoal: async (title: string, level: GoalLevel) => {
    try {
      const periodStart = Date.now();
      const newGoal = await invoke<Goal>('add_goal', {
        title,
        level,
        periodStart
      });
      set((state) => ({ goals: [...state.goals, newGoal] }));
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  toggleGoalCompletion: async (goalId: string) => {
    try {
      const updatedGoal = await invoke<Goal>('toggle_goal_completion', { goalId });
      set((state) => ({
        goals: state.goals.map((g) => (g.id === goalId ? updatedGoal : g)),
      }));
    } catch (error) {
      set({ error: String(error) });
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
    } catch (error) {
      set({ error: String(error) });
    }
  },

  setSelectedLevel: (level: GoalLevel) => {
    set({ selectedLevel: level });
  },

  getDailyGoals: () => {
    const { goals } = get();
    return goals.filter((g) => g.level === 'daily');
  },

  getWeeklyGoals: () => {
    const { goals } = get();
    return goals.filter((g) => g.level === 'weekly');
  },

  getMonthlyGoals: () => {
    const { goals } = get();
    return goals.filter((g) => g.level === 'monthly');
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

  canAddGoal: (level: GoalLevel) => {
    const { goals } = get();
    const levelGoals = goals.filter((g) => g.level === level);
    return levelGoals.length < 3;
  },
}));
