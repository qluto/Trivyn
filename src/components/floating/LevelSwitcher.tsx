import { useTranslation } from 'react-i18next';
import { GoalLevel } from '../../types';
import { useGoalStore } from '../../store/goalStore';

interface LevelSwitcherProps {
  selected: GoalLevel;
  onChange: (level: GoalLevel) => void;
  goalsCount: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

const ACCENT_COLORS: Record<GoalLevel, string> = {
  daily: 'bg-daily-accent',
  weekly: 'bg-weekly-accent',
  monthly: 'bg-monthly-accent',
};

export default function LevelSwitcher({ selected, onChange }: LevelSwitcherProps) {
  const { t } = useTranslation();
  const { getDailyGoals, getWeeklyGoals, getMonthlyGoals } = useGoalStore();
  const levels: GoalLevel[] = ['daily', 'weekly', 'monthly'];

  return (
    <div className="flex items-center gap-0.5 px-1.5 pt-1 pb-0.5">
      {levels.map((level) => {
        const isSelected = selected === level;
        const levelGoals = level === 'daily' ? getDailyGoals()
          : level === 'weekly' ? getWeeklyGoals()
          : getMonthlyGoals();
        const completedCount = levelGoals.filter((g) => g.isCompleted).length;

        return (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`
              flex-1 flex items-center justify-center gap-1 py-1 rounded-lg transition-all duration-200
              ${isSelected ? 'bg-surface-elevated dark:bg-surface-dark-elevated' : 'bg-transparent'}
            `}
          >
            {/* Level label */}
            <span className={`
              text-[11px] tracking-wide
              ${isSelected
                ? `font-semibold ${level === 'daily' ? 'text-daily-accent' : level === 'weekly' ? 'text-weekly-accent' : 'text-monthly-accent'}`
                : 'font-medium text-secondary dark:text-content-dark-secondary'
              }
            `}>
              {t(`levels.${level}`)}
            </span>

            {/* Progress dots - always show 3 dots, horizontal layout */}
            <div className="flex items-center gap-0.5">
              {[0, 1, 2].map((dotIndex) => {
                const isCompleted = dotIndex < completedCount;
                return (
                  <div
                    key={dotIndex}
                    className={`
                      w-[3px] h-[3px] rounded-full transition-colors duration-200
                      ${isCompleted
                        ? ACCENT_COLORS[level]
                        : 'bg-border dark:bg-gray-600'
                      }
                    `}
                  />
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}
