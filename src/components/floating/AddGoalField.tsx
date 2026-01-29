import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GoalLevel } from '../../types';

type AddFieldSize = 'compact' | 'default';

interface AddGoalFieldProps {
  level: GoalLevel;
  nextNumber: number;
  onAdd: (title: string) => void;
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
  },
  default: {
    circle: { width: 24, height: 24, radius: 'rounded-xl' },
    text: 'text-sm',
    numberText: 'text-xs',
    gap: 'gap-3',
    padding: 'py-3',
    showPlusIcon: true,
  },
};

export default function AddGoalField({ nextNumber, onAdd, size = 'compact' }: AddGoalFieldProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const config = SIZE_CONFIG[size];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full flex items-center ${config.gap} ${config.padding}`}>
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
        placeholder={t('goals.addPlaceholder')}
        className={`flex-1 bg-transparent ${config.text} leading-snug text-primary placeholder-tertiary dark:placeholder-content-dark-tertiary outline-none`}
      />
    </form>
  );
}
