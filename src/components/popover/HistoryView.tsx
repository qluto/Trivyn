import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGoalStore } from '../../store/goalStore';
import { Goal, GoalLevel } from '../../types';

const LEVEL_COLORS: Record<GoalLevel, string> = {
  daily: 'bg-daily-accent',
  weekly: 'bg-weekly-accent',
  monthly: 'bg-monthly-accent',
};

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

export default function HistoryView() {
  const { t, i18n } = useTranslation();
  const { goals, deleteGoal } = useGoalStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selection, setSelection] = useState<Selection>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);

  // Weekday names based on current language
  const weekdayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const weekdays = weekdayKeys.map(key => t(`weekdays.short.${key}`));

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

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelection(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelection(null);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#1a2530] to-[#0f1419]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/10">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h2 className="text-lg font-semibold text-primary">
            {i18n.language === 'ja'
              ? t('history.monthYear', { year, month: month + 1 })
              : t('history.monthYear', { month: monthNames[month], year })
            }
          </h2>

          <button
            onClick={goToNextMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto px-6">
        {/* Weekday headers */}
        <div className="grid grid-cols-8 gap-1 pt-2">
          <button
            onClick={() => setSelection({ type: 'month', year, month })}
            className="flex items-center justify-center hover:bg-white/5 transition-colors rounded"
          >
            {monthlyGoals.length > 0 && (
              <div className="flex flex-col gap-1">
                {monthlyGoals.map((goal, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      goal.isCompleted ? 'bg-monthly-accent' : 'bg-gray-500'
                    }`}
                  />
                ))}
              </div>
            )}
          </button>
          {weekdays.map((day, index) => (
            <div key={index} className="text-center text-xs font-medium text-secondary">
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
            const weekGoalsCompleted = weekGoals.filter(g => g.isCompleted).length === weekGoals.length;

            return (
              <div key={weekIndex} className="grid grid-cols-8 gap-1">
                {/* Week indicator with dots */}
                <button
                  onClick={() => setSelection({ type: 'week', year: firstDayOfWeek.getFullYear(), week: weekNum })}
                  className="flex items-center justify-center hover:bg-white/5 transition-colors rounded"
                >
                  {hasWeekGoals && (
                    <div className="flex flex-col gap-1">
                      {weekGoals.map((goal, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            goal.isCompleted ? 'bg-weekly-accent' : 'bg-gray-500'
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
                  const completedCount = dayGoals.filter((g) => g.isCompleted).length;
                  const allCompleted = hasGoals && completedCount === dayGoals.length;

                  return (
                    <button
                      key={dayIndex}
                      onClick={() => setSelection({ type: 'date', date })}
                      className={`
                        relative aspect-square rounded-lg text-base transition-all
                        ${isCurrentMonth ? 'text-primary' : 'text-secondary opacity-40'}
                        ${isToday ? 'ring-2 ring-blue-400' : ''}
                        ${isSelected ? 'bg-white/20' : 'hover:bg-white/5'}
                      `}
                    >
                      <div className="flex flex-col items-center justify-center h-full gap-0">
                        <span className={isToday ? 'font-bold' : ''}>{date.getDate()}</span>
                        {hasGoals && (
                          <div className="flex gap-0.5">
                            {dayGoals.map((goal, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  goal.isCompleted ? 'bg-daily-accent' : 'bg-gray-500'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Selection details */}
        {selection && (
          <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-primary">
                {selection.type === 'date' && (
                  i18n.language === 'ja'
                    ? `${selection.date.getMonth() + 1}月${selection.date.getDate()}日の目標`
                    : `${monthNames[selection.date.getMonth()]} ${selection.date.getDate()}`
                )}
                {selection.type === 'week' && (
                  i18n.language === 'ja'
                    ? `第${selection.week}週の目標`
                    : `Week ${selection.week}`
                )}
                {selection.type === 'month' && (
                  i18n.language === 'ja'
                    ? `${selection.month + 1}月の目標`
                    : `${monthNames[selection.month]}`
                )}
              </h3>
              <button
                onClick={() => setSelection(null)}
                className="text-xs text-secondary hover:text-primary"
              >
                {t('history.close')}
              </button>
            </div>

            {selectedGoals.length === 0 ? (
              <p className="text-xs text-secondary italic">{t('history.noGoalsOnDate')}</p>
            ) : (
              <div className="space-y-2">
                {selectedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 group"
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        goal.isCompleted ? 'bg-green-400' : LEVEL_COLORS[goal.level]
                      }`}
                    />
                    <span
                      className={`text-sm flex-1 ${
                        goal.isCompleted ? 'text-secondary line-through' : 'text-primary'
                      }`}
                    >
                      {goal.title}
                    </span>
                    {goal.isCompleted && (
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded flex-shrink-0"
                      title={t('history.delete')}
                    >
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
