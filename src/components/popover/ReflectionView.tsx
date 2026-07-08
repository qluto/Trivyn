import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useReflectionStore } from '../../store/reflectionStore';
import { useGoalStore } from '../../store/goalStore';
import { useSettingsStore } from '../../store/settingsStore';
import { GoalLevel } from '../../types';
import {
  addPeriods,
  formatPeriodLabel,
  getPeriodKey,
  isCurrentOrPastPeriod,
  isSamePeriod,
} from '../../utils/periods';

export interface PeriodChangeEvent {
  has_weekly_change: boolean;
  has_monthly_change: boolean;
  current_week_key: string;
  current_month_key: string;
}

interface ReflectionViewProps {
  onHeightChange?: (height: number) => void;
  trigger?: PeriodChangeEvent | null;
  onTriggerConsumed?: () => void;
  onPlanNext?: (level: GoalLevel) => void;
}

type ReflectionLevel = 'weekly' | 'monthly';

export default function ReflectionView({ onHeightChange, trigger, onTriggerConsumed, onPlanNext }: ReflectionViewProps) {
  const { t, i18n } = useTranslation();
  const [level, setLevel] = useState<ReflectionLevel>('weekly');
  const [targetDate, setTargetDate] = useState<Date>(() => new Date());
  const [insights, setInsights] = useState({
    insight1: '',
    insight2: '',
    insight3: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showMonthlyNotice, setShowMonthlyNotice] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastAppliedTriggerRef = useRef<PeriodChangeEvent | null>(null);

  const { loadReflection, saveReflection, getReflection } = useReflectionStore();
  const { getGoalsForPeriod } = useGoalStore();
  const { weekStart } = useSettingsStore();

  const periodKey = useMemo(
    () => getPeriodKey(level, targetDate, weekStart),
    [level, targetDate, weekStart]
  );
  const periodLabel = useMemo(
    () => formatPeriodLabel(level, targetDate, weekStart, i18n.language),
    [level, targetDate, weekStart, i18n.language]
  );
  const isCurrentPeriod = useMemo(
    () => isSamePeriod(level, targetDate, new Date(), weekStart),
    [level, targetDate, weekStart]
  );
  const canGoNext = useMemo(() => {
    const next = addPeriods(level, targetDate, 1);
    return isCurrentOrPastPeriod(level, next, weekStart);
  }, [level, targetDate, weekStart]);

  const levelGoals = useMemo(
    () => getGoalsForPeriod(level, targetDate),
    [level, targetDate, getGoalsForPeriod]
  );

  // 直前の期間を表示中で、かつ現在期間の目標に空きがあるときだけ計画導線を出す
  const isPreviousPeriod = useMemo(
    () => isSamePeriod(level, addPeriods(level, targetDate, 1), new Date(), weekStart),
    [level, targetDate, weekStart]
  );
  const showPlanNext =
    !!onPlanNext && isPreviousPeriod && getGoalsForPeriod(level, new Date()).length < 3;

  // Load reflection when target period changes
  useEffect(() => {
    loadReflection(level, periodKey);
  }, [level, periodKey, loadReflection]);

  // Sync local state with loaded reflection
  useEffect(() => {
    const reflection = getReflection(level, periodKey);
    setInsights({
      insight1: reflection?.insight1 || '',
      insight2: reflection?.insight2 || '',
      insight3: reflection?.insight3 || '',
    });
  }, [level, periodKey, getReflection]);

  // Apply trigger payload from parent (auto-target the period that just ended)
  useEffect(() => {
    if (!trigger || lastAppliedTriggerRef.current === trigger) return;
    lastAppliedTriggerRef.current = trigger;

    const { has_weekly_change, has_monthly_change } = trigger;

    if (has_weekly_change) {
      setLevel('weekly');
      setTargetDate(addPeriods('weekly', new Date(), -1));
      setShowMonthlyNotice(has_monthly_change);
    } else if (has_monthly_change) {
      setLevel('monthly');
      setTargetDate(addPeriods('monthly', new Date(), -1));
      setShowMonthlyNotice(false);
    }

    onTriggerConsumed?.();
  }, [trigger, onTriggerConsumed]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
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

  const handleLevelChange = (lvl: ReflectionLevel) => {
    if (lvl === level) return;
    setLevel(lvl);
    setTargetDate(new Date());
    if (lvl === 'monthly') {
      setShowMonthlyNotice(false);
    }
  };

  const goToPreviousPeriod = () => {
    setTargetDate((prev) => addPeriods(level, prev, -1));
  };

  const goToNextPeriod = () => {
    if (!canGoNext) return;
    setTargetDate((prev) => addPeriods(level, prev, 1));
  };

  const goToCurrentPeriod = () => {
    setTargetDate(new Date());
  };

  const openMonthly = () => {
    setLevel('monthly');
    setTargetDate(addPeriods('monthly', new Date(), -1));
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

    updateHeight();

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
          {(['weekly', 'monthly'] as ReflectionLevel[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => handleLevelChange(lvl)}
              className={`tab-pill flex-1 ${level === lvl ? 'active' : ''}`}
            >
              {t(`levels.${lvl}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Period navigation */}
      <div className="px-4 pb-2 flex items-center justify-between gap-2">
        <button
          onClick={goToPreviousPeriod}
          className="nav-btn flex-shrink-0"
          aria-label={t('reflection.previousPeriod')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex flex-col items-center min-w-0 flex-1">
          <h2 className="text-sm font-bold text-primary text-center truncate w-full">
            {periodLabel}
          </h2>
          {isCurrentPeriod ? (
            <span className="text-[10px] text-brand-primary font-medium mt-0.5">
              {t('reflection.currentPeriod')}
            </span>
          ) : (
            <button
              onClick={goToCurrentPeriod}
              className="text-[10px] text-secondary hover:text-primary transition-colors mt-0.5"
            >
              {t('reflection.backToCurrent')}
            </button>
          )}
        </div>

        <button
          onClick={goToNextPeriod}
          disabled={!canGoNext}
          className={`nav-btn flex-shrink-0 ${!canGoNext ? 'opacity-30 cursor-not-allowed' : ''}`}
          aria-label={t('reflection.nextPeriod')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-6 space-y-5">
        {/* Monthly notice banner */}
        {showMonthlyNotice && level === 'weekly' && (
          <div className="px-4 py-3 bg-brand-primary/10 border-l-3 border-brand-primary text-sm text-brand-primary rounded-md flex items-center justify-between gap-3">
            <span className="flex-1 min-w-0">{t('reflection.monthlyNotice')}</span>
            <button
              onClick={openMonthly}
              className="text-xs font-bold whitespace-nowrap underline hover:no-underline"
            >
              {t('reflection.openMonthly')}
            </button>
          </div>
        )}

        {/* Goals List (Read-only) */}
        {levelGoals.length > 0 ? (
          <div className="space-y-1">
            {levelGoals.map((goal) => (
              <div
                key={goal.id}
                className="w-full flex items-center gap-3 py-2 px-3 rounded-lg"
              >
                <div
                  className={`check-circle ${level} ${goal.isCompleted ? 'checked' : ''} flex-shrink-0`}
                >
                  {goal.isCompleted && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
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
        ) : (
          <p className="text-sm text-tertiary px-3">{t('reflection.noGoalsForPeriod')}</p>
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

        {/* Plan the next period based on this reflection */}
        {showPlanNext && (
          <div className="p-3 rounded-lg bg-surface-elevated/40 dark:bg-surface-dark-elevated/40 flex items-center justify-between gap-3">
            <p className="flex-1 min-w-0 text-xs text-secondary dark:text-content-dark-secondary leading-snug">
              {t('reflection.planNextHint')}
            </p>
            <button
              onClick={() => onPlanNext?.(level)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' }}
            >
              {t(`reflection.planNext.${level}`)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
