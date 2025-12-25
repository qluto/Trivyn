import { useGoalStore } from '../../store/goalStore';
import { GoalLevel } from '../../types';

const LEVEL_COLORS: Record<GoalLevel, string> = {
  daily: 'bg-daily-accent',
  weekly: 'bg-weekly-accent',
  monthly: 'bg-monthly-accent',
};

const LEVEL_LABELS: Record<GoalLevel, string> = {
  daily: '今日',
  weekly: '今週',
  monthly: '今月',
};

export default function HistoryView() {
  const { goals } = useGoalStore();

  // Group goals by level
  const goalsByLevel: Record<GoalLevel, typeof goals> = {
    daily: goals.filter((g) => g.level === 'daily'),
    weekly: goals.filter((g) => g.level === 'weekly'),
    monthly: goals.filter((g) => g.level === 'monthly'),
  };

  return (
    <div className="p-4 space-y-4" data-tauri-drag-region>
      <h2 className="text-lg font-semibold text-primary mb-4">目標履歴</h2>

      {/* Goals by level */}
      {(Object.keys(goalsByLevel) as GoalLevel[]).map((level) => {
        const levelGoals = goalsByLevel[level];
        const completedCount = levelGoals.filter((g) => g.isCompleted).length;

        return (
          <div key={level} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-primary flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${LEVEL_COLORS[level]}`} />
                {LEVEL_LABELS[level]}
              </h3>
              <span className="text-xs text-secondary">
                {completedCount}/{levelGoals.length} 完了
              </span>
            </div>

            {levelGoals.length === 0 ? (
              <p className="text-xs text-secondary italic pl-4">目標なし</p>
            ) : (
              <div className="space-y-1 pl-4">
                {levelGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={goal.isCompleted}
                      readOnly
                      className="w-4 h-4 rounded"
                    />
                    <span
                      className={`text-sm flex-1 ${
                        goal.isCompleted ? 'text-secondary line-through' : 'text-primary'
                      }`}
                    >
                      {goal.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
