import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { Reflection, GoalLevel } from '../types';

interface ReflectionStore {
  reflections: Map<string, Reflection>;
  loading: boolean;
  error: string | null;

  // Actions
  loadReflection: (level: GoalLevel, periodKey: string) => Promise<void>;
  saveReflection: (
    level: GoalLevel,
    periodKey: string,
    insight1: string,
    insight2: string,
    insight3: string
  ) => Promise<void>;
  getReflection: (level: GoalLevel, periodKey: string) => Reflection | null;
}

export const useReflectionStore = create<ReflectionStore>((set, get) => ({
  reflections: new Map(),
  loading: false,
  error: null,

  loadReflection: async (level: GoalLevel, periodKey: string) => {
    set({ loading: true, error: null });
    try {
      const reflection = await invoke<Reflection | null>('get_reflection', {
        level,
        periodKey,
      });

      if (reflection) {
        const key = `${level}-${periodKey}`;
        set((state) => {
          const newReflections = new Map(state.reflections);
          newReflections.set(key, reflection);
          return { reflections: newReflections, loading: false };
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  saveReflection: async (
    level: GoalLevel,
    periodKey: string,
    insight1: string,
    insight2: string,
    insight3: string
  ) => {
    try {
      const savedReflection = await invoke<Reflection>('save_reflection', {
        level,
        periodKey,
        insight1: insight1 || null,
        insight2: insight2 || null,
        insight3: insight3 || null,
      });

      const key = `${level}-${periodKey}`;
      set((state) => {
        const newReflections = new Map(state.reflections);
        newReflections.set(key, savedReflection);
        return { reflections: newReflections };
      });
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  getReflection: (level: GoalLevel, periodKey: string) => {
    const key = `${level}-${periodKey}`;
    return get().reflections.get(key) || null;
  },
}));
