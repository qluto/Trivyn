import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { AppLanguage, WindowPosition } from '../types';

interface SettingsStore {
  weekStart: number;
  language: AppLanguage;
  floatingWindowPosition: WindowPosition;
  loading: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  setWeekStart: (day: number) => Promise<void>;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  setFloatingWindowPosition: (pos: WindowPosition) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  weekStart: 2, // Monday
  language: 'system',
  floatingWindowPosition: { x: 0, y: 0 },
  loading: false,

  loadSettings: async () => {
    set({ loading: true });
    try {
      const settings = await invoke<Record<string, string>>('get_all_settings', {});
      set({
        weekStart: parseInt(settings.week_start || '2'),
        language: (settings.language as AppLanguage) || 'system',
        floatingWindowPosition: JSON.parse(
          settings.floating_window_position || '{"x":0,"y":0}'
        ),
        loading: false,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ loading: false });
    }
  },

  setWeekStart: async (day: number) => {
    try {
      await invoke('set_setting', { key: 'week_start', value: String(day) });
      set({ weekStart: day });
    } catch (error) {
      console.error('Failed to set week start:', error);
    }
  },

  setLanguage: async (lang: AppLanguage) => {
    try {
      await invoke('set_setting', { key: 'language', value: lang });
      set({ language: lang });
    } catch (error) {
      console.error('Failed to set language:', error);
    }
  },

  setFloatingWindowPosition: async (pos: WindowPosition) => {
    try {
      await invoke('set_setting', {
        key: 'floating_window_position',
        value: JSON.stringify(pos),
      });
      set({ floatingWindowPosition: pos });
    } catch (error) {
      console.error('Failed to set window position:', error);
    }
  },
}));
