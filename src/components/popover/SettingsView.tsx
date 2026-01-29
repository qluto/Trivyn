import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../store/settingsStore';

interface SettingsViewProps {
  onHeightChange?: (height: number) => void;
}

// Toggle component
const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`toggle-switch ${checked ? 'active' : ''}`}
    role="switch"
    aria-checked={checked}
  />
);

// Day picker button
const DayButton = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`
      flex-1 py-2.5 rounded-md text-xs font-bold transition-all duration-200
      ${active
        ? 'text-white'
        : 'text-secondary hover:bg-surface-elevated dark:hover:bg-surface-dark-elevated'
      }
    `}
    style={active ? { background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' } : {}}
  >
    {label}
  </button>
);

export default function SettingsView({ onHeightChange }: SettingsViewProps) {
  const { t, i18n } = useTranslation();
  const { weekStart, language, theme, reflectionPromptEnabled, loadSettings, setWeekStart, setLanguage, setTheme, setReflectionPromptEnabled } = useSettingsStore();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Notify parent of height changes
  useEffect(() => {
    if (!onHeightChange || !contentRef.current) return;

    const updateHeight = () => {
      if (contentRef.current) {
        const height = contentRef.current.scrollHeight;
        onHeightChange(height);
      }
    };

    // Update immediately
    updateHeight();

    // Use ResizeObserver to detect content changes
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(contentRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [onHeightChange]);

  const dayLabels = i18n.language === 'ja'
    ? ['日', '月', '火', '水', '木', '金', '土']
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const languageOptions = [
    { value: 'system', label: t('settings.language.system') },
    { value: 'ja', label: '日本語' },
    { value: 'en', label: 'English' },
  ];

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  return (
    <div ref={contentRef} className="px-4 py-4 pb-6 space-y-6">
      {/* Language setting */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-primary block">
          {t('settings.language.label')}
        </label>
        <div className="relative">
          <select
            className="input-field appearance-none pr-10 cursor-pointer"
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'system' | 'en' | 'ja')}
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Appearance setting */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-primary block">
          {t('settings.appearance.label')}
        </label>
        <div className="relative">
          <select
            className="input-field appearance-none pr-10 cursor-pointer"
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'system' | 'light' | 'dark')}
          >
            {themeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Week start setting */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-primary block">
          {t('settings.weekStart.label')}
        </label>
        <div className="flex gap-1 p-1 bg-surface-elevated/50 dark:bg-surface-dark-elevated/50 rounded-md">
          {dayLabels.map((label, index) => (
            <DayButton
              key={index}
              label={label}
              active={weekStart === index + 1}
              onClick={() => setWeekStart(index + 1)}
            />
          ))}
        </div>
      </div>

      {/* Notifications setting */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-primary block">
          {t('settings.notifications.label')}
        </label>
        <div className="flex items-center justify-between p-3 bg-surface-elevated/50 dark:bg-surface-dark-elevated/50 rounded-md">
          <span className="text-sm text-primary">{t('settings.notifications.reflectionPrompt')}</span>
          <Toggle checked={reflectionPromptEnabled} onChange={setReflectionPromptEnabled} />
        </div>
      </div>

      {/* Footer */}
      <div className="pt-6 text-center space-y-1">
        <p className="text-sm font-semibold text-primary">Trivyn v1.0.0</p>
        <p className="text-xs text-tertiary">Three Wins メソッドで目標を達成</p>
      </div>
    </div>
  );
}
