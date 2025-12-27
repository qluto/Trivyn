import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../store/settingsStore';

export default function SettingsView() {
  const { t } = useTranslation();
  const { weekStart, language, loadSettings, setWeekStart, setLanguage } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const weekStartOptions = [
    { value: 1, label: t('weekdays.sunday') },
    { value: 2, label: t('weekdays.monday') },
    { value: 3, label: t('weekdays.tuesday') },
    { value: 4, label: t('weekdays.wednesday') },
    { value: 5, label: t('weekdays.thursday') },
    { value: 6, label: t('weekdays.friday') },
    { value: 7, label: t('weekdays.saturday') },
  ];

  const languageOptions = [
    { value: 'system', label: t('settings.language.system') },
    { value: 'ja', label: t('settings.language.ja') },
    { value: 'en', label: t('settings.language.en') },
  ];

  const weekdayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const weekStartDayName = t(`weekdays.${weekdayKeys[(weekStart - 1) % 7]}`);

  const handleWeekStartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setWeekStart(parseInt(e.target.value));
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as 'system' | 'en' | 'ja');
  };

  return (
    <div className="px-3 py-2 pb-4 space-y-4">
      <div data-tauri-drag-region>
        <h2 className="text-lg font-semibold text-primary mb-2">{t('settings.title')}</h2>
        <p className="text-sm text-secondary">
          {t('settings.description')}
        </p>
      </div>

      {/* Week start setting */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-primary block">
          {t('settings.weekStart.label')}
        </label>
        <p className="text-xs text-secondary mb-2">
          {t('settings.weekStart.description')}
        </p>
        <select
          className="
            w-full p-3 rounded-lg
            bg-white/5 border border-white/10
            text-sm text-primary
            focus:outline-none focus:ring-2 focus:ring-white/20
            cursor-pointer
          "
          value={weekStart}
          onChange={handleWeekStartChange}
        >
          {weekStartOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-gray-800">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Language setting */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-primary block">
          {t('settings.language.label')}
        </label>
        <p className="text-xs text-secondary mb-2">
          {t('settings.language.description')}
        </p>
        <select
          className="
            w-full p-3 rounded-lg
            bg-white/5 border border-white/10
            text-sm text-primary
            focus:outline-none focus:ring-2 focus:ring-white/20
            cursor-pointer
          "
          value={language}
          onChange={handleLanguageChange}
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-gray-800">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Notifications setting */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-primary block">
          {t('settings.notifications.label')}
        </label>
        <p className="text-xs text-secondary mb-2">
          {t('settings.notifications.description')}
        </p>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded"
              defaultChecked
            />
            <div className="flex-1">
              <div className="text-sm text-primary">{t('settings.notifications.weeklyReminder')}</div>
              <div className="text-xs text-secondary">{weekStartDayName}{t('settings.notifications.weeklyReminderDesc')}</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded"
              defaultChecked
            />
            <div className="flex-1">
              <div className="text-sm text-primary">{t('settings.notifications.monthlyReminder')}</div>
              <div className="text-xs text-secondary">{t('settings.notifications.monthlyReminderDesc')}</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded"
              defaultChecked
            />
            <div className="flex-1">
              <div className="text-sm text-primary">{t('settings.notifications.reflectionPrompt')}</div>
              <div className="text-xs text-secondary">{t('settings.notifications.reflectionPromptDesc')}</div>
            </div>
          </label>
        </div>
      </div>

      {/* App info */}
      <div className="pt-2 border-t border-white/10" data-tauri-drag-region>
        <div className="text-xs text-secondary space-y-1">
          <div>{t('app.name')} {t('app.version')}</div>
          <div>{t('app.description')}</div>
        </div>
      </div>
    </div>
  );
}
