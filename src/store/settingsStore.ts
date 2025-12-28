import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { AppLanguage, WindowPosition } from '../types';
import i18n from '../i18n';

interface SettingsStore {
  weekStart: number;
  language: AppLanguage;
  floatingWindowPosition: WindowPosition;
  reflectionPromptEnabled: boolean;
  loading: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  setWeekStart: (day: number) => Promise<void>;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  setFloatingWindowPosition: (pos: WindowPosition) => Promise<void>;
  setReflectionPromptEnabled: (enabled: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  weekStart: 2, // Monday
  language: 'system',
  floatingWindowPosition: { x: 0, y: 0 },
  reflectionPromptEnabled: true,
  loading: false,

  loadSettings: async () => {
    set({ loading: true });
    try {
      const settings = await invoke<Record<string, string>>('get_all_settings', {});
      const lang = (settings.language as AppLanguage) || 'system';

      // Apply language to i18n
      let i18nLang = lang;
      if (lang === 'system') {
        // Use browser's language detection
        i18nLang = navigator.language.startsWith('ja') ? 'ja' : 'en';
      }
      await i18n.changeLanguage(i18nLang);

      set({
        weekStart: parseInt(settings.week_start || '2'),
        language: lang,
        floatingWindowPosition: JSON.parse(
          settings.floating_window_position || '{"x":0,"y":0}'
        ),
        reflectionPromptEnabled: settings.reflection_prompt_enabled !== 'false',
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
      // Apply language to i18n
      let i18nLang = lang;
      if (lang === 'system') {
        i18nLang = navigator.language.startsWith('ja') ? 'ja' : 'en';
      }
      await i18n.changeLanguage(i18nLang);

      // Save to database and emit event to all windows via Rust
      await invoke('set_language', {
        language: lang,
        i18nLanguage: i18nLang
      });

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

  setReflectionPromptEnabled: async (enabled: boolean) => {
    try {
      await invoke('set_setting', {
        key: 'reflection_prompt_enabled',
        value: String(enabled),
      });
      set({ reflectionPromptEnabled: enabled });
    } catch (error) {
      console.error('Failed to set reflection prompt enabled:', error);
    }
  },
}));
