import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GoalLevel } from '../../types';
import { useReflectionStore, generatePeriodKey } from '../../store/reflectionStore';
import { useGoalStore } from '../../store/goalStore';

interface ReflectionViewProps {
  level: GoalLevel;
  onClose: () => void;
}

export default function ReflectionView({ level, onClose }: ReflectionViewProps) {
  const { t } = useTranslation();
  const [insights, setInsights] = useState({
    insight1: '',
    insight2: '',
    insight3: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const { loadReflection, saveReflection, getReflection } = useReflectionStore();
  const { goals } = useGoalStore();

  // Calculate goals stats for this level
  const levelGoals = goals.filter((g) => g.level === level);
  const completedGoals = levelGoals.filter((g) => g.isCompleted).length;
  const totalGoals = levelGoals.length;

  // Load reflection when component mounts or level changes
  useEffect(() => {
    const periodKey = generatePeriodKey(level);
    loadReflection(level, periodKey);
  }, [level, loadReflection]);

  // Update local state when reflection data is loaded
  useEffect(() => {
    const periodKey = generatePeriodKey(level);
    const reflection = getReflection(level, periodKey);

    if (reflection) {
      setInsights({
        insight1: reflection.insight1 || '',
        insight2: reflection.insight2 || '',
        insight3: reflection.insight3 || '',
      });
    } else {
      setInsights({
        insight1: '',
        insight2: '',
        insight3: '',
      });
    }
  }, [level, getReflection]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const periodKey = generatePeriodKey(level);
      await saveReflection(
        level,
        periodKey,
        insights.insight1,
        insights.insight2,
        insights.insight3
      );
    } catch (error) {
      console.error('Failed to save reflection:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#1a2530] to-[#0f1419]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10" data-tauri-drag-region>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-primary">{t(`levels.${level}`)}{t('reflection.title')}</h1>
        <div className="w-8" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Progress Circle */}
        <div className="flex flex-col items-center py-4">
          <div className="relative w-32 h-32">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-white/10"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className="text-blue-400"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - (totalGoals > 0 ? completedGoals / totalGoals : 0))}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-primary">{completedGoals}/{totalGoals}</div>
              <div className="text-sm text-secondary">{t('goals.completed')}</div>
            </div>
          </div>
          {totalGoals === 0 && (
            <p className="text-sm text-secondary mt-4">{t('goals.noGoals')}</p>
          )}
        </div>

        <div className="h-px bg-white/10" />

        {/* Reflection Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            <h2 className="text-base font-semibold text-primary">{t('reflection.insights')}</h2>
          </div>

          <div className="space-y-3">
            {[
              { key: 'insight1' as const, placeholder: t('reflection.placeholder') },
              { key: 'insight2' as const, placeholder: t('reflection.placeholder') },
              { key: 'insight3' as const, placeholder: t('reflection.placeholder') },
            ].map((item, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0 mt-3">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                </div>
                <textarea
                  value={insights[item.key]}
                  onChange={(e) => setInsights({ ...insights, [item.key]: e.target.value })}
                  className="
                    flex-1 bg-white/5 border border-white/10 rounded-lg p-3
                    text-sm text-primary placeholder-white/30
                    focus:outline-none focus:ring-2 focus:ring-purple-400/50
                    resize-none min-h-[60px]
                  "
                  placeholder={item.placeholder}
                  rows={2}
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-secondary pl-5">
            {t('reflection.hint')}
          </p>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="px-3 py-2 border-t border-white/10 flex gap-2">
        <button
          onClick={onClose}
          className="
            flex-1 py-2 px-3 rounded-lg
            bg-white/5 hover:bg-white/10
            text-primary font-medium text-sm
            transition-all duration-200
          "
        >
          {t('reflection.close')}
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="
            flex-1 py-2 px-3 rounded-lg
            bg-white/10 hover:bg-white/15
            text-primary font-medium text-sm
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isSaving ? t('reflection.saving') : t('reflection.save')}
        </button>
      </div>
    </div>
  );
}
