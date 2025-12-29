import { Goal, GoalLevel } from '../../types';

interface NumberedGoalRowProps {
  number: number;
  goal: Goal;
  level: GoalLevel;
  onToggle: (position: { x: number; y: number }) => void;
  onDelete?: () => void;
}

const LEVEL_COLORS: Record<GoalLevel, { border: string; fill: string }> = {
  daily: { border: 'border-daily-accent', fill: 'bg-daily-accent' },
  weekly: { border: 'border-weekly-accent', fill: 'bg-weekly-accent' },
  monthly: { border: 'border-monthly-accent', fill: 'bg-monthly-accent' },
};

export default function NumberedGoalRow({ number, goal, level, onToggle, onDelete }: NumberedGoalRowProps) {
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
          flex-1 min-w-0 text-left text-xs leading-snug break-words whitespace-normal
          transition-all duration-200
          ${isCompleted
            ? 'text-secondary line-through'
            : 'text-primary'
          }
        `}
      >
        {goal.title}
      </span>

      {/* Delete button - only shown when onDelete is provided */}
      {onDelete && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded flex-shrink-0"
          title="削除"
        >
          <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}
