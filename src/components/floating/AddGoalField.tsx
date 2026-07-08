import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Goal, GoalLevel } from '../../types';

type AddFieldSize = 'compact' | 'default';

interface AddGoalFieldProps {
  level: GoalLevel;
  nextNumber: number;
  onAdd: (title: string, parentGoalId?: string | null) => void;
  parentGoals?: Goal[];
  size?: AddFieldSize;
}

// Size configurations
const SIZE_CONFIG = {
  compact: {
    circle: { width: 16, height: 16, radius: 'rounded-lg' },
    text: 'text-[11px]',
    numberText: 'text-[9px]',
    gap: 'gap-1.5',
    padding: 'py-[5px]',
    showPlusIcon: false,
    chipText: 'text-[9px]',
    chipTitleMax: 'max-w-[72px]',
    linkHintText: 'text-[9px]',
  },
  default: {
    circle: { width: 24, height: 24, radius: 'rounded-xl' },
    text: 'text-sm',
    numberText: 'text-xs',
    gap: 'gap-3',
    padding: 'py-3',
    showPlusIcon: true,
    chipText: 'text-[11px]',
    chipTitleMax: 'max-w-[140px]',
    linkHintText: 'text-[10px]',
  },
};

// ライトモードでは暗めのアクセント（コントラスト確保）、ダークモードでは通常のアクセント
const PARENT_CHIP_ACTIVE: Record<GoalLevel, string> = {
  daily: 'bg-daily-accent/15 text-daily-accent-text dark:text-daily-accent border-daily-accent/40',
  weekly: 'bg-weekly-accent/15 text-weekly-accent-text dark:text-weekly-accent border-weekly-accent/40',
  monthly: 'bg-monthly-accent/15 text-monthly-accent-text dark:text-monthly-accent border-monthly-accent/40',
};

export default function AddGoalField({ nextNumber, onAdd, parentGoals = [], size = 'compact' }: AddGoalFieldProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [focused, setFocused] = useState(false);
  const [parentGoalId, setParentGoalId] = useState<string | null>(null);
  const config = SIZE_CONFIG[size];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), parentGoalId);
      setTitle('');
      setParentGoalId(null);
    }
  };

  const showParentChips =
    parentGoals.length > 0 && (focused || title.length > 0 || parentGoalId !== null);
  const parentLevel = parentGoals[0]?.level;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`w-full flex items-center ${config.gap} ${config.padding}`}>
        {/* Add circle */}
        <div
          style={{
            width: `${config.circle.width}px`,
            height: `${config.circle.height}px`,
            minWidth: `${config.circle.width}px`,
            minHeight: `${config.circle.height}px`
          }}
          className={`${config.circle.radius} ${config.showPlusIcon ? 'bg-surface-elevated dark:bg-surface-dark-elevated' : 'border-[1.5px] border-border dark:border-gray-600'} flex items-center justify-center flex-shrink-0`}
        >
          {config.showPlusIcon ? (
            <svg className="w-3.5 h-3.5 text-tertiary dark:text-content-dark-tertiary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          ) : (
            <span className={`${config.numberText} leading-none font-semibold text-secondary dark:text-content-dark-secondary`}>
              {nextNumber}
            </span>
          )}
        </div>

        {/* Input field */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={t('goals.addPlaceholder')}
          className={`flex-1 bg-transparent ${config.text} leading-snug text-primary placeholder-tertiary dark:placeholder-content-dark-tertiary outline-none`}
        />
      </div>

      {/* Optional link to a parent-level goal */}
      {showParentChips && parentLevel && (
        <div
          className="pb-1.5"
          style={{ paddingLeft: `${config.circle.width + (size === 'compact' ? 6 : 12)}px` }}
        >
          <p className={`${config.linkHintText} text-tertiary dark:text-content-dark-tertiary mb-1`}>
            {t('goals.linkHint')}
          </p>
          <div className="flex flex-wrap gap-1">
            {parentGoals.map((parent, index) => {
              const isSelected = parentGoalId === parent.id;
              return (
                <button
                  key={parent.id}
                  type="button"
                  // チップのクリックで入力のフォーカスを奪わない
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setParentGoalId(isSelected ? null : parent.id)}
                  title={parent.title}
                  aria-pressed={isSelected}
                  className={`
                    flex items-center gap-1 rounded-full border ${config.chipText} font-medium
                    ${size === 'compact' ? 'px-1.5 py-[3px]' : 'px-2 py-1'}
                    transition-colors duration-150
                    ${isSelected
                      ? PARENT_CHIP_ACTIVE[parentLevel]
                      : 'border-border dark:border-gray-600 text-secondary dark:text-content-dark-secondary hover:text-primary'
                    }
                  `}
                >
                  <span className="font-bold">{index + 1}</span>
                  <span className={`truncate ${config.chipTitleMax}`}>{parent.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </form>
  );
}
