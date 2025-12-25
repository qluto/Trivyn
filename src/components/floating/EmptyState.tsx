import { GoalLevel } from '../../types';

interface EmptyStateProps {
  level: GoalLevel;
}

const EMPTY_MESSAGES: Record<GoalLevel, string> = {
  daily: '今日の目標を設定しましょう',
  weekly: '今週の目標を設定しましょう',
  monthly: '今月の目標を設定しましょう',
};

export default function EmptyState({ level }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4" data-tauri-drag-region>
      <p className="text-sm text-secondary text-center">
        {EMPTY_MESSAGES[level]}
      </p>
      <p className="text-xs text-white/20 text-center mt-2">
        最大3つまで設定できます
      </p>
    </div>
  );
}
