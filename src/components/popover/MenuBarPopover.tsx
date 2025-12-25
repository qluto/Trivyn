import { useState } from 'react';
import { useGoalStore } from '../../store/goalStore';
import { GoalLevel } from '../../types';
import HistoryView from './HistoryView';
import ReflectionView from './ReflectionView';
import SettingsView from './SettingsView';
import NumberedGoalRow from '../floating/NumberedGoalRow';

type BottomTab = 'goals' | 'reflection' | 'history';

const LEVEL_LABELS: Record<GoalLevel, string> = {
  daily: '今日',
  weekly: '今週',
  monthly: '今月',
};

export default function MenuBarPopover() {
  const [selectedLevel, setSelectedLevel] = useState<GoalLevel>('daily');
  const [bottomTab, setBottomTab] = useState<BottomTab>('goals');
  const { goals, toggleGoalCompletion } = useGoalStore();

  const currentGoals = goals.filter((g) => g.level === selectedLevel);

  const handleToggle = async (goalId: string) => {
    await toggleGoalCompletion(goalId);
  };

  return (
    <div className="relative w-[600px] h-[700px]">
      {/* Arrow pointing up to tray icon */}
      <div className="absolute -top-2 right-12 w-4 h-4 bg-[rgba(20,25,30,0.85)] border-l border-t border-subtle rotate-45" />

      {/* Main popover container */}
      <div className="relative h-full rounded-xl glass-dark border border-subtle shadow-2xl flex flex-col overflow-hidden">
        {/* Header with Tria logo and level tabs */}
        <div className="border-b border-subtle" data-tauri-drag-region>
          <div className="flex items-center justify-between p-4">
            <h1 className="text-2xl font-bold text-primary">Tria</h1>

            {/* Level tabs */}
            <div className="flex gap-2">
              {(Object.keys(LEVEL_LABELS) as GoalLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`
                    px-4 py-1.5 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${selectedLevel === level
                      ? 'bg-white/15 text-primary'
                      : 'text-secondary hover:bg-white/5 hover:text-primary'
                    }
                  `}
                >
                  {LEVEL_LABELS[level]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {bottomTab === 'goals' && (
            <div className="p-4 space-y-2">
              {/* Add goal button */}
              <button className="w-full p-4 rounded-lg border border-dashed border-white/20 hover:border-white/30 hover:bg-white/5 transition-all flex items-center gap-3 text-secondary hover:text-primary">
                <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center">
                  <span className="text-lg">+</span>
                </div>
                <span className="text-sm">新しい目標を追加...</span>
              </button>

              {/* Goals list */}
              {currentGoals.map((goal, index) => (
                <NumberedGoalRow
                  key={goal.id}
                  number={index + 1}
                  goal={goal}
                  level={selectedLevel}
                  onToggle={() => handleToggle(goal.id)}
                />
              ))}
            </div>
          )}
          {bottomTab === 'reflection' && <ReflectionView />}
          {bottomTab === 'history' && <HistoryView />}
        </div>

        {/* Bottom navigation bar */}
        <div className="border-t border-subtle bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-around p-3">
            <button
              onClick={() => setBottomTab('goals')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                bottomTab === 'goals' ? 'text-primary' : 'text-secondary hover:text-primary'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>

            <button
              onClick={() => setBottomTab('reflection')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                bottomTab === 'reflection' ? 'text-primary' : 'text-secondary hover:text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="text-sm">振り返り</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            <button
              onClick={() => setBottomTab('history')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                bottomTab === 'history' ? 'text-primary' : 'text-secondary hover:text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">履歴</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
