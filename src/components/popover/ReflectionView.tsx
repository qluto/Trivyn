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

const LEVEL_COLORS: Record<GoalLevel, string> = {
  daily: 'bg-daily-accent',
  weekly: 'bg-weekly-accent',
  monthly: 'bg-monthly-accent',
};

interface ReflectionViewProps {
  onHeightChange?: (height: number) => void;
}

export default function ReflectionView({ onHeightChange }: ReflectionViewProps) {
  const { t } = useTranslation();
  const [level, setLevel] = useState<GoalLevel>('daily');
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
    <div ref={contentRef} className="flex flex-col bg-transparent">
      {/* Level tabs */}
      <div className="border-b border-gray-900/10 dark:border-white/10 px-3 py-2">
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as GoalLevel[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevel(lvl)}
              className={`
                flex-1 px-4 py-1.5 rounded-lg text-sm font-medium
                transition-all duration-200
                ${level === lvl
                  ? 'bg-gray-900/10 dark:bg-white/15 text-primary'
                  : 'text-secondary hover:bg-gray-900/5 dark:hover:bg-white/5 hover:text-primary'
                }
              `}
            >
              {t(`levels.${lvl}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="overflow-hidden px-3 py-3 pb-4 space-y-4">
        {/* Monthly notice banner */}
        {showMonthlyNotice && (
          <div className="px-4 py-2 bg-blue-500/10 border-l-2 border-blue-500 text-sm text-blue-400 rounded">
            月次の振り返りも期限を迎えています。週次の後にご記入ください。
          </div>
        )}

        {/* Goals List (Read-only) */}
        {levelGoals.length > 0 && (
          <div className="space-y-0">
            {levelGoals.map((goal, index) => (
              <div
                key={goal.id}
                className="w-full flex items-center gap-2 py-1 px-1.5 rounded-lg"
              >
                {/* Number circle */}
                <div
                  className={`
                    flex items-center justify-center
                    w-5 h-5 rounded-full border-2
                    ${goal.isCompleted
                      ? `${LEVEL_COLORS[level]} border-transparent`
                      : 'border-gray-900/15 dark:border-white/20'
                    }
                  `}
                >
                  <span className={`text-[10px] leading-none font-semibold ${goal.isCompleted ? 'text-white' : 'text-secondary'}`}>
                    {index + 1}
                  </span>
                </div>

                {/* Goal text */}
                <span
                  className={`
                    flex-1 min-w-0 text-left text-xs leading-snug break-words whitespace-normal
                    ${goal.isCompleted
                      ? 'text-secondary line-through'
                      : 'text-primary'
                    }
                  `}
                >
                  {goal.title}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="h-px bg-gray-900/10 dark:bg-white/10" />

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
                  <div className="w-2 h-2 rounded-full bg-gray-900/70 dark:bg-white/70" />
                </div>
                <textarea
                  value={insights[item.key]}
                  onChange={(e) => setInsights({ ...insights, [item.key]: e.target.value })}
                  onBlur={handleBlur}
                  className="
                    flex-1 bg-gray-900/5 dark:bg-white/5 border border-gray-900/10 dark:border-white/10 rounded-lg p-3
                    text-sm text-primary placeholder-gray-500/60 dark:placeholder-white/30
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
    </div>
  );
}
