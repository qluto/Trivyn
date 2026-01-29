import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { listen } from '@tauri-apps/api/event';
import { GoalLevel } from '../../types';
import { useReflectionStore, generatePeriodKey } from '../../store/reflectionStore';
import { useGoalStore } from '../../store/goalStore';

interface PeriodChangeEvent {
  has_weekly_change: boolean;
  has_monthly_change: boolean;
  current_week_key: string;
  current_month_key: string;
}

interface ReflectionViewProps {
  onHeightChange?: (height: number) => void;
}

export default function ReflectionView({ onHeightChange }: ReflectionViewProps) {
  const { t } = useTranslation();
  const [level, setLevel] = useState<GoalLevel>('weekly');
  const [insights, setInsights] = useState({
    insight1: '',
    insight2: '',
    insight3: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showMonthlyNotice, setShowMonthlyNotice] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { loadReflection, saveReflection, getReflection } = useReflectionStore();
  const { getDailyGoals, getWeeklyGoals, getMonthlyGoals } = useGoalStore();

  // Calculate goals stats for this level (current period only)
  const levelGoals = level === 'daily' ? getDailyGoals()
    : level === 'weekly' ? getWeeklyGoals()
    : getMonthlyGoals();

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

  // Listen for reflection prompt trigger events
  useEffect(() => {
    const setupReflectionListener = async () => {
      const unlisten = await listen<PeriodChangeEvent>('reflection-prompt-trigger', (event) => {
        const { has_weekly_change, has_monthly_change } = event.payload;

        console.log('[ReflectionView] Received reflection-prompt-trigger event:', event.payload);

        // 週次と月次の両方が該当する場合、通知バナーを表示
        if (has_weekly_change && has_monthly_change) {
          setShowMonthlyNotice(true);
        }
      });

      return unlisten;
    };

    const cleanup = setupReflectionListener();
    return () => {
      cleanup.then(unlisten => {
        if (unlisten) unlisten();
      });
    };
  }, []);

  const handleSave = async () => {
    if (isSaving) return;
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

  const handleBlur = () => {
    handleSave();
  };

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
  }, [level, insights, showMonthlyNotice, levelGoals.length, onHeightChange]);

  return (
    <div ref={contentRef} className="flex flex-col">
      {/* Level tabs - only weekly and monthly for reflection */}
      <div className="px-4 py-3">
        <div className="flex gap-1 p-1 bg-surface-elevated/50 dark:bg-surface-dark-elevated/50 rounded-lg">
          {(['weekly', 'monthly'] as GoalLevel[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevel(lvl)}
              className={`tab-pill flex-1 ${level === lvl ? 'active' : ''}`}
            >
              {t(`levels.${lvl}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-6 space-y-5">
        {/* Monthly notice banner */}
        {showMonthlyNotice && (
          <div className="px-4 py-3 bg-brand-primary/10 border-l-3 border-brand-primary text-sm text-brand-primary rounded-md">
            月次の振り返りも期限を迎えています。週次の後にご記入ください。
          </div>
        )}

        {/* Goals List (Read-only) */}
        {levelGoals.length > 0 && (
          <div className="space-y-1">
            {levelGoals.map((goal) => (
              <div
                key={goal.id}
                className="w-full flex items-center gap-3 py-2 px-3 rounded-lg"
              >
                {/* Check circle */}
                <div
                  className={`check-circle ${level} ${goal.isCompleted ? 'checked' : ''} flex-shrink-0`}
                >
                  {goal.isCompleted && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Goal text */}
                <span
                  className={`
                    flex-1 min-w-0 text-left text-sm leading-snug break-words whitespace-normal
                    ${goal.isCompleted
                      ? 'text-tertiary dark:text-content-dark-tertiary line-through'
                      : 'text-primary font-medium'
                    }
                  `}
                >
                  {goal.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Reflection Section */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-primary">{t('reflection.insights')}</h2>

          <div className="space-y-3">
            {[
              { key: 'insight1' as const, placeholder: t('reflection.placeholder') },
              { key: 'insight2' as const, placeholder: t('reflection.placeholder') },
              { key: 'insight3' as const, placeholder: t('reflection.placeholder') },
            ].map((item, index) => (
              <textarea
                key={index}
                value={insights[item.key]}
                onChange={(e) => setInsights({ ...insights, [item.key]: e.target.value })}
                onBlur={handleBlur}
                className="input-field resize-none min-h-[56px]"
                placeholder={item.placeholder}
                rows={2}
              />
            ))}
          </div>

          <p className="text-xs text-tertiary">
            {t('reflection.hint')}
          </p>
        </div>
      </div>
    </div>
  );
}
