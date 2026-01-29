import { Goal, GoalLevel } from '../../types';

type GoalRowSize = 'compact' | 'default';

interface NumberedGoalRowProps {
  number: number;
  goal: Goal;
  level: GoalLevel;
  onToggle: (position: { x: number; y: number }) => void;
  onDelete?: () => void;
  size?: GoalRowSize;
}

const GRADIENT_BACKGROUNDS: Record<GoalLevel, string> = {
  daily: 'bg-gradient-to-br from-daily-accent to-[#F5A682]',
  weekly: 'bg-gradient-to-br from-weekly-accent to-[#A78BFA]',
  monthly: 'bg-gradient-to-br from-monthly-accent to-[#5EEAD4]',
};

// Size configurations
const SIZE_CONFIG = {
  compact: {
    circle: { width: 16, height: 16, radius: 'rounded-lg' },
    text: 'text-[11px]',
    numberText: 'text-[9px]',
    gap: 'gap-1.5',
    padding: 'py-[5px]',
    showCheckmark: false,
  },
  default: {
    circle: { width: 24, height: 24, radius: 'rounded-xl' },
    text: 'text-sm',
    numberText: 'text-xs',
    gap: 'gap-3',
    padding: 'py-3',
    showCheckmark: true,
  },
};

export default function NumberedGoalRow({ number, goal, level, onToggle, onDelete, size = 'compact' }: NumberedGoalRowProps) {
  const isCompleted = goal.isCompleted;
  const config = SIZE_CONFIG[size];

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
      className={`w-full flex items-center ${config.gap} ${config.padding} group transition-colors`}
      data-tauri-drag-region
    >
      {/* Check/Number circle */}
      <button
        onClick={handleClick}
        style={{
          width: `${config.circle.width}px`,
          height: `${config.circle.height}px`,
          minWidth: `${config.circle.width}px`,
          minHeight: `${config.circle.height}px`
        }}
        className={`
          ${config.circle.radius} flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:scale-110
          ${isCompleted
            ? GRADIENT_BACKGROUNDS[level]
            : 'border-[1.5px] border-border dark:border-gray-600 bg-transparent'
          }
        `}
      >
        {isCompleted && config.showCheckmark ? (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className={`
            ${config.numberText} leading-none font-bold
            ${isCompleted
              ? 'text-white'
              : 'text-secondary dark:text-content-dark-secondary'
            }
          `}>
            {number}
          </span>
        )}
      </button>

      {/* Goal text - draggable */}
      <span
        data-tauri-drag-region
        className={`
          flex-1 min-w-0 text-left ${config.text} leading-snug break-words whitespace-normal
          transition-all duration-200
          ${isCompleted
            ? 'text-tertiary dark:text-content-dark-tertiary'
            : 'text-primary font-semibold'
          }
        `}
      >
        {goal.title}
      </span>

      {/* Delete button - only shown when onDelete is provided */}
      {onDelete && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/10 rounded-lg flex-shrink-0"
          title="削除"
        >
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}
