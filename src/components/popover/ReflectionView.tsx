import { useState, useEffect } from 'react';
import { GoalLevel } from '../../types';
import { useReflectionStore, generatePeriodKey } from '../../store/reflectionStore';
import { useGoalStore } from '../../store/goalStore';

const LEVEL_LABELS: Record<GoalLevel, string> = {
  daily: '今日',
  weekly: '今週',
  monthly: '今月',
};

interface ReflectionViewProps {
  level: GoalLevel;
  onClose: () => void;
}

export default function ReflectionView({ level, onClose }: ReflectionViewProps) {
  const [insights, setInsights] = useState({
    insight1: '',
    insight2: '',
    insight3: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const { loadReflection, saveReflection, getReflection } = useReflectionStore();
  const { goals } = useGoalStore();

  // Calculate goals stats for this level
  const levelGoals = goals.filter((g) => g.level === level);
  const completedGoals = levelGoals.filter((g) => g.isCompleted).length;
  const totalGoals = levelGoals.length;

  // Load reflection when component mounts or level changes
  useEffect(() => {
    const periodKey = generatePeriodKey(level);
    loadReflection(level, periodKey);
  }, [level, loadReflection]);

  // Update local state when reflection data is loaded
  useEffect(() => {
    const periodKey = generatePeriodKey(level);
    const reflection = getReflection(level, periodKey);

    if (reflection) {
      setInsights({
        insight1: reflection.insight1 || '',
        insight2: reflection.insight2 || '',
        insight3: reflection.insight3 || '',
      });
    } else {
      setInsights({
        insight1: '',
        insight2: '',
        insight3: '',
      });
    }
  }, [level, getReflection]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const periodKey = generatePeriodKey(level);
      await saveReflection(
        level,
        periodKey,
        insights.insight1,
        insights.insight2,
        insights.insight3
      );
    } catch (error) {
      console.error('Failed to save reflection:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#1a2530] to-[#0f1419]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10" data-tauri-drag-region>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-primary">{LEVEL_LABELS[level]}の振り返り</h1>
        <div className="w-8" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Progress Circle */}
        <div className="flex flex-col items-center py-8">
          <div className="relative w-40 h-40">
            <svg className="transform -rotate-90 w-40 h-40">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-white/10"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className="text-blue-400"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - (totalGoals > 0 ? completedGoals / totalGoals : 0))}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold text-primary">{completedGoals}/{totalGoals}</div>
              <div className="text-sm text-secondary">達成</div>
            </div>
          </div>
          {totalGoals === 0 && (
            <p className="text-sm text-secondary mt-4">ゴールが設定されていませんでした</p>
          )}
        </div>

        <div className="h-px bg-white/10" />

        {/* Reflection Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            <h2 className="text-base font-semibold text-primary">気づき・学び</h2>
          </div>

          <div className="space-y-3">
            {[
              { key: 'insight1' as const, placeholder: '振り返りポイント...' },
              { key: 'insight2' as const, placeholder: '振り返りポイント...' },
              { key: 'insight3' as const, placeholder: '振り返りポイント...' },
            ].map((item, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0 mt-3">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                </div>
                <textarea
                  value={insights[item.key]}
                  onChange={(e) => setInsights({ ...insights, [item.key]: e.target.value })}
                  className="
                    flex-1 bg-white/5 border border-white/10 rounded-lg p-3
                    text-sm text-primary placeholder-white/30
                    focus:outline-none focus:ring-2 focus:ring-purple-400/50
                    resize-none min-h-[60px]
                  "
                  placeholder={item.placeholder}
                  rows={2}
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-secondary pl-5">
            うまくいったこと、改善点、次に活かせることなど
          </p>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="p-4 border-t border-white/10 flex gap-3">
        <button
          onClick={onClose}
          className="
            flex-1 py-3 px-4 rounded-lg
            bg-white/5 hover:bg-white/10
            text-primary font-medium text-sm
            transition-all duration-200
          "
        >
          閉じる
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="
            flex-1 py-3 px-4 rounded-lg
            bg-white/10 hover:bg-white/15
            text-primary font-medium text-sm
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}
