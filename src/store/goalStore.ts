import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen, Event } from '@tauri-apps/api/event';
import { Goal, GoalLevel } from '../types';

interface GoalStore {
  goals: Goal[];
  selectedLevel: GoalLevel;
  loading: boolean;
  error: string | null;

  // Actions
  loadGoals: () => Promise<void>;
  addGoal: (title: string, level: GoalLevel) => Promise<void>;
  toggleGoalCompletion: (goalId: string) => Promise<Goal>;
  updateGoal: (goalId: string, title: string) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  setSelectedLevel: (level: GoalLevel) => void;
  setupEventListeners: () => Promise<void>;

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

  addGoal: async (title: string, level: GoalLevel) => {
    try {
      const periodStart = Date.now();
      const newGoal = await invoke<Goal>('add_goal', {
        title,
        level,
        periodStart
      });
      set((state) => ({ goals: [...state.goals, newGoal] }));
      // Event is emitted from Rust backend
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
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
