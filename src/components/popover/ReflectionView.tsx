import { useState } from 'react';
import { GoalLevel } from '../../types';

const LEVEL_LABELS: Record<GoalLevel, string> = {
  daily: '今日',
  weekly: '今週',
  monthly: '今月',
};

const LEVEL_COLORS: Record<GoalLevel, string> = {
  daily: 'border-daily-accent',
  weekly: 'border-weekly-accent',
  monthly: 'border-monthly-accent',
};

export default function ReflectionView() {
  const [selectedLevel, setSelectedLevel] = useState<GoalLevel>('weekly');
  const [insights, setInsights] = useState({
    insight1: '',
    insight2: '',
    insight3: '',
  });

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving reflections:', insights);
  };

  return (
    <div className="p-4 space-y-4">
      <div data-tauri-drag-region>
        <h2 className="text-lg font-semibold text-primary mb-2">振り返り</h2>
        <p className="text-sm text-secondary mb-4">
          目標を振り返り、学んだことを記録しましょう
        </p>
      </div>

      {/* Level selector */}
      <div className="flex gap-2" data-tauri-drag-region>
        {(Object.keys(LEVEL_LABELS) as GoalLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`
              flex-1 py-2 px-3 rounded-lg text-sm
              transition-all duration-200
              ${selectedLevel === level
                ? 'bg-white/10 text-primary backdrop-blur-sm'
                : 'text-secondary hover:bg-white/5'
              }
            `}
          >
            {LEVEL_LABELS[level]}
          </button>
        ))}
      </div>

      {/* Reflection prompts */}
      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm text-primary block">
            1. 何がうまくいきましたか？
          </label>
          <textarea
            value={insights.insight1}
            onChange={(e) => setInsights({ ...insights, insight1: e.target.value })}
            className={`
              w-full p-3 rounded-lg bg-white/5 border ${LEVEL_COLORS[selectedLevel]}
              text-sm text-primary placeholder-white/30
              focus:outline-none focus:ring-2 focus:ring-white/20
              resize-none
            `}
            rows={3}
            placeholder="学んだことを記録..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-primary block">
            2. 何が改善できますか？
          </label>
          <textarea
            value={insights.insight2}
            onChange={(e) => setInsights({ ...insights, insight2: e.target.value })}
            className={`
              w-full p-3 rounded-lg bg-white/5 border ${LEVEL_COLORS[selectedLevel]}
              text-sm text-primary placeholder-white/30
              focus:outline-none focus:ring-2 focus:ring-white/20
              resize-none
            `}
            rows={3}
            placeholder="改善点を記録..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-primary block">
            3. 次に活かすことは？
          </label>
          <textarea
            value={insights.insight3}
            onChange={(e) => setInsights({ ...insights, insight3: e.target.value })}
            className={`
              w-full p-3 rounded-lg bg-white/5 border ${LEVEL_COLORS[selectedLevel]}
              text-sm text-primary placeholder-white/30
              focus:outline-none focus:ring-2 focus:ring-white/20
              resize-none
            `}
            rows={3}
            placeholder="次回への活かし方を記録..."
          />
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className={`
          w-full py-3 px-4 rounded-lg
          bg-white/10 hover:bg-white/15
          text-primary font-medium text-sm
          transition-all duration-200
          border ${LEVEL_COLORS[selectedLevel]}
        `}
      >
        保存
      </button>
    </div>
  );
}
