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
    <div
      className="w-full flex items-center gap-2 py-1 px-1.5 rounded-lg group"
      data-tauri-drag-region
    >
      {/* Number circle - clickable */}
      <button
        onClick={handleClick}
        className={`
          flex items-center justify-center
          w-5 h-5 rounded-full border-2
          transition-all duration-200
          hover:scale-110
          ${isCompleted
            ? `${colors.fill} ${colors.border}`
            : `border-gray-900/15 dark:border-white/20 ${colors.border} hover:${colors.border}`
          }
        `}
      >
        <span className={`text-[10px] leading-none font-semibold ${isCompleted ? 'text-white dark:text-white' : 'text-secondary'}`}>
          {number}
        </span>
      </button>

      {/* Goal text - draggable */}
      <span
        data-tauri-drag-region
        className={`
          flex-1 text-left text-xs leading-snug
          transition-all duration-200
          ${isCompleted
            ? 'text-secondary line-through'
            : 'text-primary'
          }
        `}
      >
        {goal.title}
      </span>
    </div>
  );
}
