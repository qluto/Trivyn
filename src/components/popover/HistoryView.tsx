import { useState, useMemo } from 'react';
import { useGoalStore } from '../../store/goalStore';
import { Goal, GoalLevel } from '../../types';

const LEVEL_COLORS: Record<GoalLevel, string> = {
  daily: 'bg-daily-accent',
  weekly: 'bg-weekly-accent',
  monthly: 'bg-monthly-accent',
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

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

function getGoalsForDate(goals: Goal[], date: Date): Goal[] {
  return goals.filter((goal) => {
    const goalDate = new Date(goal.createdAt);
    return isSameDay(goalDate, date);
  });
}

export default function HistoryView() {
  const { goals } = useGoalStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);

  const selectedDateGoals = useMemo(() => {
    if (!selectedDate) return [];
    return getGoalsForDate(goals, selectedDate);
  }, [goals, selectedDate]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#1a2530] to-[#0f1419]">
      {/* Header */}
      <div className="p-4 border-b border-white/10" data-tauri-drag-region>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goToPreviousMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h2 className="text-lg font-semibold text-primary">
            {year}年 {month + 1}月
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

        <button
          onClick={goToToday}
          className="w-full py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-primary text-sm font-medium transition-colors"
        >
          今日に戻る
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-secondary py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            const isCurrentMonth = date.getMonth() === month;
            const isToday = isSameDay(date, new Date());
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const dayGoals = getGoalsForDate(goals, date);
            const hasGoals = dayGoals.length > 0;
            const completedCount = dayGoals.filter((g) => g.isCompleted).length;
            const allCompleted = hasGoals && completedCount === dayGoals.length;

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`
                  relative aspect-square rounded-lg p-1 text-sm transition-all
                  ${isCurrentMonth ? 'text-primary' : 'text-secondary opacity-40'}
                  ${isToday ? 'ring-2 ring-blue-400' : ''}
                  ${isSelected ? 'bg-white/20' : 'hover:bg-white/5'}
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className={isToday ? 'font-bold' : ''}>{date.getDate()}</span>
                  {hasGoals && (
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: Math.min(dayGoals.length, 3) }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 h-1 rounded-full ${
                            allCompleted ? 'bg-green-400' : 'bg-blue-400/60'
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

        {/* Selected date details */}
        {selectedDate && (
          <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-primary">
                {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-xs text-secondary hover:text-primary"
              >
                閉じる
              </button>
            </div>

            {selectedDateGoals.length === 0 ? (
              <p className="text-xs text-secondary italic">この日の目標はありません</p>
            ) : (
              <div className="space-y-2">
                {selectedDateGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5"
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
                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
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
