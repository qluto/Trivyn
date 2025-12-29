import { useTranslation } from 'react-i18next';
import { GoalLevel } from '../../types';

interface EmptyStateProps {
  level: GoalLevel;
}

export default function EmptyState({ level }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4" data-tauri-drag-region>
      <p className="text-sm text-secondary text-center">
        {t(`goals.empty.${level}`)}
      </p>
      <p className="text-xs text-gray-900/20 dark:text-white/20 text-center mt-2">
        {t('goals.maxHint')}
      </p>
    </div>
  );
}
