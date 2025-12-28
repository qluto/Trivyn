import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../store/settingsStore';

export default function SettingsView() {
  const { t } = useTranslation();
  const { weekStart, language, reflectionPromptEnabled, loadSettings, setWeekStart, setLanguage, setReflectionPromptEnabled } = useSettingsStore();

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
      {/* Week start setting */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-primary block">
          {t('settings.weekStart.label')}
        </label>
        <select
          className="
            w-full p-3 rounded-lg
            bg-white/5 border border-white/10
            text-sm text-primary
            focus:outline-none focus:ring-2 focus:ring-white/20
            cursor-pointer
            appearance-none
            [&>option]:bg-gray-900 [&>option]:text-white
          "
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
            paddingRight: '2.5rem'
          }}
          value={weekStart}
          onChange={handleWeekStartChange}
        >
          {weekStartOptions.map((option) => (
            <option key={option.value} value={option.value}>
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
        <select
          className="
            w-full p-3 rounded-lg
            bg-white/5 border border-white/10
            text-sm text-primary
            focus:outline-none focus:ring-2 focus:ring-white/20
            cursor-pointer
            appearance-none
            [&>option]:bg-gray-900 [&>option]:text-white
          "
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
            paddingRight: '2.5rem'
          }}
          value={language}
          onChange={handleLanguageChange}
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
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
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer">
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                className="
                  w-5 h-5 rounded cursor-pointer
                  appearance-none
                  bg-white/5 border border-white/10
                  checked:bg-white/20 checked:border-white/30
                  transition-all duration-200
                "
                checked={reflectionPromptEnabled}
                onChange={(e) => setReflectionPromptEnabled(e.target.checked)}
              />
              {reflectionPromptEnabled && (
                <svg
                  className="absolute inset-0 w-5 h-5 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="white"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm text-primary">{t('settings.notifications.reflectionPrompt')}</div>
              <div className="text-xs text-secondary">{t('settings.notifications.reflectionPromptDesc')}</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
