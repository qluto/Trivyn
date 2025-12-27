import { Goal, GoalLevel } from '../../types';

interface NumberedGoalRowProps {
  number: number;
  goal: Goal;
  level: GoalLevel;
  onToggle: (position: { x: number; y: number }) => void;
}

const LEVEL_COLORS: Record<GoalLevel, { border: string; fill: string }> = {
  daily: { border: 'border-daily-accent', fill: 'bg-daily-accent' },
  weekly: { border: 'border-weekly-accent', fill: 'bg-weekly-accent' },
  monthly: { border: 'border-monthly-accent', fill: 'bg-monthly-accent' },
};

export default function NumberedGoalRow({ number, goal, level, onToggle }: NumberedGoalRowProps) {
  const colors = LEVEL_COLORS[level];
  const isCompleted = goal.isCompleted;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    onToggle(position);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-2.5 py-2 px-3 rounded-lg
                 hover:bg-white/5 transition-all duration-200
                 group"
    >
      {/* Number circle */}
      <div
        className={`
          flex items-center justify-center
          w-6 h-6 rounded-full border-2
          transition-all duration-200
          ${isCompleted
            ? `${colors.fill} ${colors.border}`
            : `border-white/20 ${colors.border}`
          }
        `}
      >
        <span className={`text-xs font-semibold ${isCompleted ? 'text-white' : 'text-secondary'}`}>
          {number}
        </span>
      </div>

      {/* Goal text */}
      <span
        className={`
          flex-1 text-left text-sm
          transition-all duration-200
          ${isCompleted
            ? 'text-secondary line-through'
            : 'text-primary group-hover:text-white'
          }
        `}
      >
        {goal.title}
      </span>
    </button>
  );
}
