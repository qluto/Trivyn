import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GoalLevel } from '../../types';
import { useGoalStore } from '../../store/goalStore';
import { getParentLevel } from '../../utils/periods';

type ContextSize = 'compact' | 'default';

interface ParentGoalsContextProps {
  level: GoalLevel;
  onNavigate?: (level: GoalLevel) => void;
  size?: ContextSize;
  className?: string;
}

// ライトモードでは暗めのアクセント（コントラスト確保）、ダークモードでは通常のアクセント
const ACCENT_TEXT: Record<GoalLevel, string> = {
  daily: 'text-daily-accent-text dark:text-daily-accent',
  weekly: 'text-weekly-accent-text dark:text-weekly-accent',
  monthly: 'text-monthly-accent-text dark:text-monthly-accent',
};

const ACCENT_BG: Record<GoalLevel, string> = {
  daily: 'bg-daily-accent',
  weekly: 'bg-weekly-accent',
  monthly: 'bg-monthly-accent',
};

// 紐づく下位目標の達成数バッジ（下位レベルのアクセントカラー）
const CHILD_BADGE: Record<GoalLevel, string> = {
  daily: 'bg-daily-accent/10 text-daily-accent-text dark:text-daily-accent',
  weekly: 'bg-weekly-accent/10 text-weekly-accent-text dark:text-weekly-accent',
  monthly: 'bg-monthly-accent/10 text-monthly-accent-text dark:text-monthly-accent',
};

const SIZE_CONFIG = {
  compact: {
    container: 'rounded-lg px-2 py-1',
    headerText: 'text-[9px]',
    goalText: 'text-[10px]',
    goalGap: 'gap-1.5 py-0.5',
    dot: 'w-[5px] h-[5px]',
    badgeText: 'text-[9px] px-1',
    chevron: 'w-2.5 h-2.5',
  },
  default: {
    container: 'rounded-lg px-3 py-2',
    headerText: 'text-[11px]',
    goalText: 'text-xs',
    goalGap: 'gap-2 py-1',
    dot: 'w-[6px] h-[6px]',
    badgeText: 'text-[9px] px-1.5',
    chevron: 'w-3 h-3',
  },
};

export default function ParentGoalsContext({
  level,
  onNavigate,
  size = 'default',
  className = '',
}: ParentGoalsContextProps) {
  const { t } = useTranslation();
  // 折りたたみ状態はウィンドウ（サイズ）ごとに保存。省スペースなフローティング側は初期状態で折りたたむ
  const collapseKey = `trivyn.parentContext.collapsed.${size}`;
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(collapseKey);
    if (stored === null) return size === 'compact';
    return stored === '1';
  });
  // セレクタなしの購読なので goals の変更で再レンダリングされる
  const { getParentGoals, getChildStats } = useGoalStore();

  const parentLevel = getParentLevel(level);
  if (!parentLevel) return null;

  const parentGoals = getParentGoals(level);
  const completedCount = parentGoals.filter((g) => g.isCompleted).length;
  const config = SIZE_CONFIG[size];

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(collapseKey, next ? '1' : '0');
      return next;
    });
  };

  return (
    <div
      className={`bg-surface-elevated/40 dark:bg-surface-dark-elevated/40 ${config.container} ${className}`}
    >
      {/* Header: parent level label + progress dots + collapse toggle */}
      <button
        onClick={toggleCollapsed}
        className="w-full flex items-center gap-1.5"
        aria-expanded={!collapsed}
      >
        <span
          className={`${config.headerText} font-semibold tracking-wide ${ACCENT_TEXT[parentLevel]}`}
        >
          {t(`context.title.${parentLevel}`)}
        </span>

        {parentGoals.length > 0 ? (
          <span className="flex items-center gap-0.5">
            {[0, 1, 2].map((dotIndex) => (
              <span
                key={dotIndex}
                className={`
                  w-[3px] h-[3px] rounded-full
                  ${dotIndex < completedCount
                    ? ACCENT_BG[parentLevel]
                    : 'bg-border dark:bg-gray-600'
                  }
                `}
              />
            ))}
          </span>
        ) : (
          // 未設定はレベルスイッチャー側の赤ドットが担うため、ここでは控えめな中空ドットに留める
          <span className="w-[5px] h-[5px] rounded-full border border-border dark:border-gray-600" />
        )}

        <span className="flex-1" />

        <svg
          className={`${config.chevron} text-tertiary dark:text-content-dark-tertiary transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Body */}
      {!collapsed && (
        parentGoals.length > 0 ? (
          <div className="mt-0.5">
            {parentGoals.map((goal) => {
              const stats = getChildStats(goal.id);
              return (
                <div
                  key={goal.id}
                  className={`flex items-center ${config.goalGap}`}
                >
                  <span
                    className={`
                      ${config.dot} rounded-full flex-shrink-0
                      ${goal.isCompleted
                        ? ACCENT_BG[parentLevel]
                        : 'border border-border dark:border-gray-600'
                      }
                    `}
                  />
                  <span
                    className={`
                      flex-1 min-w-0 truncate ${config.goalText} leading-snug
                      ${goal.isCompleted
                        ? 'text-tertiary dark:text-content-dark-tertiary line-through'
                        : 'text-secondary dark:text-content-dark-secondary'
                      }
                    `}
                    title={goal.title}
                  >
                    {goal.title}
                  </span>
                  {stats && (
                    <span
                      className={`flex-shrink-0 ${config.badgeText} py-px rounded font-semibold ${CHILD_BADGE[level]}`}
                      title={t('goals.contribution')}
                    >
                      {stats.completed}/{stats.total}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`mt-0.5 flex items-center ${config.goalGap}`}>
            <span className={`flex-1 min-w-0 truncate ${config.goalText} text-tertiary dark:text-content-dark-tertiary`}>
              {t('context.notSet')}
            </span>
            {onNavigate && (
              <button
                onClick={() => onNavigate(parentLevel)}
                className={`flex-shrink-0 px-1.5 py-1 -my-1 ${config.goalText} font-semibold ${ACCENT_TEXT[parentLevel]} hover:underline`}
              >
                {t('context.set')}
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}
