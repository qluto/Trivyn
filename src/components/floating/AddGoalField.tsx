import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GoalLevel } from '../../types';

interface AddGoalFieldProps {
  level: GoalLevel;
  nextNumber: number;
  onAdd: (title: string) => void;
}

const LEVEL_COLORS: Record<GoalLevel, string> = {
  daily: 'border-daily-accent focus:border-daily-accent',
  weekly: 'border-weekly-accent focus:border-weekly-accent',
  monthly: 'border-monthly-accent focus:border-monthly-accent',
};

export default function AddGoalField({ level, nextNumber, onAdd }: AddGoalFieldProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex items-center gap-2 py-1 px-1.5">
      {/* Number indicator */}
      <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white/10">
        <span className="text-[10px] leading-none font-semibold text-white/20">
          {nextNumber}
        </span>
      </div>

      {/* Input field */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={t('goals.addPlaceholder')}
        className={`
          flex-1 bg-transparent border-b-2 border-transparent
          text-xs leading-snug text-primary placeholder-white/30
          outline-none transition-all duration-200
          ${isFocused ? LEVEL_COLORS[level] : 'border-white/10'}
        `}
      />
    </form>
  );
}
