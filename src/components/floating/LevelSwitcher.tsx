import { useTranslation } from 'react-i18next';
import { GoalLevel } from '../../types';

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
  const levels: GoalLevel[] = ['daily', 'weekly', 'monthly'];

  return (
    <div className="flex items-center justify-around p-2 gap-1">
      {levels.map((level) => {
        const isSelected = selected === level;
        const count = goalsCount[level];
        const completedCount = 0; // TODO: Get from actual completed goals

        return (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`
              flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg
              transition-all duration-200
              ${isSelected
                ? 'bg-white/10 backdrop-blur-sm'
                : 'hover:bg-white/5'
              }
            `}
          >
            <span className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-secondary'}`}>
              {t(`levels.${level}`)}
            </span>

            {/* Progress dots */}
            <div className="flex gap-1">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={`
                    w-1.5 h-1.5 rounded-full transition-all
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
          </button>
        );
      })}
    </div>
  );
}
