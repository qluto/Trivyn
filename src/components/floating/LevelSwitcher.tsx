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
  const { goals } = useGoalStore();
  const levels: GoalLevel[] = ['daily', 'weekly', 'monthly'];

  return (
    <div className="flex items-center justify-around p-1 gap-0.5">
      {levels.map((level) => {
        const isSelected = selected === level;
        const count = goalsCount[level];
        const completedCount = goals.filter((g) => g.level === level && g.isCompleted).length;

        return (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`
              flex-1 flex flex-row items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg
              transition-all duration-200
              ${isSelected
                ? 'bg-white/10 backdrop-blur-sm'
                : 'hover:bg-white/5'
              }
            `}
          >
            {/* Progress dots */}
            <div className="flex gap-0.5">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={`
                    w-1 h-1 rounded-full transition-all
                    ${index < count
                      ? index < completedCount
                        ? LEVEL_COLORS[level]
                        : 'bg-white/30'
                      : 'bg-white/10'
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
