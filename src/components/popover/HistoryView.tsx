import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGoalStore } from '../../store/goalStore';
import { useReflectionStore } from '../../store/reflectionStore';
import { Goal, GoalLevel } from '../../types';

interface HistoryViewProps {
  onHeightChange?: (height: number) => void;
}

function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  // Add padding for days before the month starts
  const firstDayOfWeek = firstDay.getDay();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push(date);
  }

  // Add all days in the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  // Add padding for days after the month ends
  const remainingDays = 7 - (days.length % 7);
  if (remainingDays < 7) {
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
  }

  return days;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function getGoalsForDate(goals: Goal[], date: Date, level?: GoalLevel): Goal[] {
  return goals.filter((goal) => {
    const goalDate = new Date(goal.createdAt);
    const matchesDate = isSameDay(goalDate, date);
    return level ? matchesDate && goal.level === level : matchesDate;
  });
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getWeekGoals(goals: Goal[], year: number, weekNum: number): Goal[] {
  return goals.filter((goal) => {
    if (goal.level !== 'weekly') return false;
    const goalDate = new Date(goal.createdAt);
    return goalDate.getFullYear() === year && getWeekNumber(goalDate) === weekNum;
  });
}

function getMonthGoals(goals: Goal[], year: number, month: number): Goal[] {
  return goals.filter((goal) => {
    if (goal.level !== 'monthly') return false;
    const goalDate = new Date(goal.createdAt);
    return goalDate.getFullYear() === year && goalDate.getMonth() === month;
  });
}

type Selection =
  | { type: 'date'; date: Date }
  | { type: 'week'; year: number; week: number }
  | { type: 'month'; year: number; month: number }
  | null;

// Generate period key for a specific selection
function generatePeriodKeyForSelection(selection: Selection): string | null {
  if (!selection) return null;

  switch (selection.type) {
    case 'date':
      // Format: YYYY-MM-DD
      const year = selection.date.getFullYear();
      const month = String(selection.date.getMonth() + 1).padStart(2, '0');
      const day = String(selection.date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    case 'week':
      // Format: YYYY-Www
      return `${selection.year}-W${String(selection.week).padStart(2, '0')}`;
    case 'month':
      // Format: YYYY-MM
      const monthStr = String(selection.month + 1).padStart(2, '0');
      return `${selection.year}-${monthStr}`;
    default:
      return null;
  }
}

// Get level from selection type
function getLevelFromSelection(selection: Selection): GoalLevel | null {
  if (!selection) return null;
  switch (selection.type) {
    case 'date':
      return 'daily';
    case 'week':
      return 'weekly';
    case 'month':
      return 'monthly';
    default:
      return null;
  }
}

export default function HistoryView({ onHeightChange }: HistoryViewProps) {
  const { t, i18n } = useTranslation();
  const { goals } = useGoalStore();
  const { loadReflection, getReflection } = useReflectionStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selection, setSelection] = useState<Selection>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);

  // Weekday names based on current language
  const weekdays = i18n.language === 'ja'
    ? ['日', '月', '火', '水', '木', '金', '土']
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Get monthly goals for current month
  const monthlyGoals = useMemo(() => getMonthGoals(goals, year, month), [goals, year, month]);

  // Month names for English
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  const selectedGoals = useMemo(() => {
    if (!selection) return [];

    switch (selection.type) {
      case 'date':
        return getGoalsForDate(goals, selection.date, 'daily');
      case 'week':
        return getWeekGoals(goals, selection.year, selection.week);
      case 'month':
        return getMonthGoals(goals, selection.year, selection.month);
      default:
        return [];
    }
  }, [goals, selection]);

  // Load reflection when selection changes
  useEffect(() => {
    const level = getLevelFromSelection(selection);
    const periodKey = generatePeriodKeyForSelection(selection);

    if (level && periodKey) {
      loadReflection(level, periodKey);
    }
  }, [selection, loadReflection]);

  // Get reflection for current selection
  const selectedReflection = useMemo(() => {
    const level = getLevelFromSelection(selection);
    const periodKey = generatePeriodKeyForSelection(selection);

    if (!level || !periodKey) return null;

    return getReflection(level, periodKey);
  }, [selection, getReflection]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelection(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelection(null);
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
  }, [selection, selectedGoals.length, selectedReflection, onHeightChange]);

  return (
    <div ref={contentRef} className="flex flex-col">
      {/* Month navigation */}
      <div className="px-4 py-3 flex items-center justify-between">
        <button
          onClick={goToPreviousMonth}
          className="nav-btn"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Monthly progress dots */}
        <div className="flex items-center gap-3">
          {monthlyGoals.length > 0 && (
            <button
              onClick={() => setSelection({ type: 'month', year, month })}
              className="flex gap-1"
            >
              {monthlyGoals.map((goal, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    goal.isCompleted ? 'bg-monthly-accent' : 'bg-border'
                  }`}
                />
              ))}
            </button>
          )}
          <h2 className="text-base font-bold text-primary">
            {i18n.language === 'ja'
              ? t('history.monthYear', { year, month: month + 1 })
              : t('history.monthYear', { month: monthNames[month], year })
            }
          </h2>
        </div>

        <button
          onClick={goToNextMonth}
          className="nav-btn"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="px-4 pb-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-8 gap-1 mb-1">
          <div /> {/* Week indicator column */}
          {weekdays.map((day, index) => (
            <div key={index} className="text-center text-xs font-medium text-tertiary py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="space-y-1">
          {Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIndex) => {
            const weekStart = weekIndex * 7;
            const weekDays = days.slice(weekStart, weekStart + 7);
            const firstDayOfWeek = weekDays[0];
            const weekNum = getWeekNumber(firstDayOfWeek);
            const weekGoals = getWeekGoals(goals, firstDayOfWeek.getFullYear(), weekNum);
            const hasWeekGoals = weekGoals.length > 0;

            return (
              <div key={weekIndex} className="grid grid-cols-8 gap-1">
                {/* Week indicator with dots */}
                <button
                  onClick={() => setSelection({ type: 'week', year: firstDayOfWeek.getFullYear(), week: weekNum })}
                  className="flex items-center justify-center h-10 hover:bg-surface-elevated/50 dark:hover:bg-surface-dark-elevated/50 transition-colors rounded-md"
                >
                  {hasWeekGoals && (
                    <div className="flex flex-col gap-0.5">
                      {weekGoals.map((goal, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            goal.isCompleted ? 'bg-weekly-accent' : 'bg-border'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>

                {/* Days of the week */}
                {weekDays.map((date, dayIndex) => {
                  const isCurrentMonth = date.getMonth() === month;
                  const isToday = isSameDay(date, new Date());
                  const isSelected = selection?.type === 'date' && isSameDay(date, selection.date);
                  const dayGoals = getGoalsForDate(goals, date, 'daily');
                  const hasGoals = dayGoals.length > 0;

                  return (
                    <button
                      key={dayIndex}
                      onClick={() => setSelection({ type: 'date', date })}
                      className={`
                        relative h-10 rounded-md text-sm transition-all flex flex-col items-center justify-center
                        ${isCurrentMonth ? 'text-primary' : 'text-tertiary opacity-40'}
                        ${isSelected ? 'text-white' : 'hover:bg-surface-elevated/50 dark:hover:bg-surface-dark-elevated/50'}
                      `}
                      style={isSelected ? { background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' } : {}}
                    >
                      <span className={`${isToday && !isSelected ? 'font-bold text-brand-primary' : ''}`}>
                        {date.getDate()}
                      </span>
                      {hasGoals && !isSelected && (
                        <div className="flex gap-0.5 mt-0.5">
                          {dayGoals.map((goal, i) => (
                            <div
                              key={i}
                              className={`w-1 h-1 rounded-full ${
                                goal.isCompleted ? 'bg-daily-accent' : 'bg-border'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Selection details */}
        {selection && (
          <div className="mt-4 p-4 bg-surface-elevated/50 dark:bg-surface-dark-elevated/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-primary">
                  {selection.type === 'date' && (
                    i18n.language === 'ja'
                      ? `${selection.date.getMonth() + 1}月${selection.date.getDate()}日（${weekdays[selection.date.getDay()]}）`
                      : `${monthNames[selection.date.getMonth()]} ${selection.date.getDate()}`
                  )}
                  {selection.type === 'week' && (
                    i18n.language === 'ja'
                      ? `第${selection.week}週`
                      : `Week ${selection.week}`
                  )}
                  {selection.type === 'month' && (
                    i18n.language === 'ja'
                      ? `${selection.month + 1}月`
                      : `${monthNames[selection.month]}`
                  )}
                </h3>
                {selectedGoals.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold text-white rounded-md" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' }}>
                    {selectedGoals.filter(g => g.isCompleted).length}/{selectedGoals.length} 完了
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelection(null)}
                className="text-xs text-secondary hover:text-primary transition-colors"
              >
                {t('history.close')}
              </button>
            </div>

            {selectedGoals.length === 0 ? (
              <p className="text-sm text-tertiary">{t('history.noGoalsOnDate')}</p>
            ) : (
              <div className="space-y-2">
                {selectedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center gap-3 py-2"
                  >
                    <div
                      className={`check-circle ${goal.level} ${goal.isCompleted ? 'checked' : ''} flex-shrink-0`}
                      style={{ width: '20px', height: '20px' }}
                    >
                      {goal.isCompleted && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm flex-1 min-w-0 break-words whitespace-normal ${
                        goal.isCompleted ? 'text-tertiary line-through' : 'text-primary'
                      }`}
                    >
                      {goal.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Reflection display */}
            {selectedReflection && (
              <>
                <div className="h-px bg-border-subtle dark:bg-gray-700 my-4" />
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-primary">{t('reflection.insights')}</h4>
                  <div className="space-y-2">
                    {[selectedReflection.insight1, selectedReflection.insight2, selectedReflection.insight3]
                      .filter(insight => insight && insight.trim() !== '')
                      .map((insight, index) => (
                        <p key={index} className="text-sm text-secondary leading-relaxed">{insight}</p>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
