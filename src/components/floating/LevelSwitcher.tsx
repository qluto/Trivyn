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

const LEVEL_COLORS: Record<GoalLevel, string> = {
  daily: 'bg-daily-accent',
  weekly: 'bg-weekly-accent',
  monthly: 'bg-monthly-accent',
};

export default function LevelSwitcher({ selected, onChange, goalsCount }: LevelSwitcherProps) {
  const { t } = useTranslation();
  const { getDailyGoals, getWeeklyGoals, getMonthlyGoals } = useGoalStore();
  const levels: GoalLevel[] = ['daily', 'weekly', 'monthly'];

  return (
    <div className="flex items-center justify-around p-1 gap-0.5">
      {levels.map((level) => {
        const isSelected = selected === level;
        const count = goalsCount[level];
        const levelGoals = level === 'daily' ? getDailyGoals()
          : level === 'weekly' ? getWeeklyGoals()
          : getMonthlyGoals();
        const completedCount = levelGoals.filter((g) => g.isCompleted).length;

        return (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`
              flex-1 flex flex-row items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg
              transition-all duration-200
              ${isSelected
                ? 'bg-gray-900/10 dark:bg-white/10 backdrop-blur-sm'
                : 'hover:bg-gray-900/5 dark:hover:bg-white/5'
              }
            `}
          >
            {/* Progress dots */}
            <div className="flex gap-0.5">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={`
                    w-1.5 h-1.5 rounded-full transition-all
                    ${index < count
                      ? index < completedCount
                        ? LEVEL_COLORS[level]
                        : 'bg-gray-900/30 dark:bg-white/30'
                      : 'bg-gray-900/10 dark:bg-white/10'
                    }
                  `}
                />
              ))}
            </div>

            <span className={`text-[11px] leading-none font-medium ${isSelected ? 'text-primary' : 'text-secondary'}`}>
              {t(`levels.${level}`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
