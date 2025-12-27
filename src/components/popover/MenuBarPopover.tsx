import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGoalStore } from '../../store/goalStore';
import { GoalLevel } from '../../types';
import HistoryView from './HistoryView';
import ReflectionView from './ReflectionView';
import SettingsView from './SettingsView';
import NumberedGoalRow from '../floating/NumberedGoalRow';
import AddGoalField from '../floating/AddGoalField';
import ConfettiView from '../common/ConfettiView';

type BottomTab = 'goals' | 'reflection' | 'history' | 'settings';

export default function MenuBarPopover() {
  const { t } = useTranslation();
  const [selectedLevel, setSelectedLevel] = useState<GoalLevel>('daily');
  const [bottomTab, setBottomTab] = useState<BottomTab>('goals');
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiLevel, setConfettiLevel] = useState<GoalLevel>('daily');
  const [confettiPosition, setConfettiPosition] = useState({ x: 0, y: 0 });
  const { goals, loadGoals, addGoal, toggleGoalCompletion, canAddGoal, setupEventListeners } = useGoalStore();

  useEffect(() => {
    loadGoals();
    const cleanup = setupEventListeners();
    return () => {
      cleanup.then(unlisten => unlisten && unlisten());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset confetti when changing tabs (level or bottom tab)
  useEffect(() => {
    setShowConfetti(false);
  }, [selectedLevel, bottomTab]);

  const currentGoals = goals.filter((g) => g.level === selectedLevel);
  const canAdd = canAddGoal(selectedLevel);

  const handleAddGoal = async (title: string) => {
    try {
      await addGoal(title, selectedLevel);
    } catch (error) {
      console.error('Failed to add goal:', error);
    }
  };

  const handleToggle = async (goalId: string, position: { x: number; y: number }) => {
    try {
      // Toggle the goal and get the updated state
      const updatedGoal = await toggleGoalCompletion(goalId);

      // Show confetti only if the goal was just completed (is now true)
      if (updatedGoal.isCompleted) {
        setConfettiLevel(updatedGoal.level);
        setConfettiPosition(position);
        setShowConfetti(true);

        // Safety timeout to ensure confetti is hidden after animation (3 seconds)
        setTimeout(() => {
          setShowConfetti(false);
        }, 3500);
      }
    } catch (error) {
      console.error('Failed to toggle goal:', error);
    }
  };

  return (
    <>
      {showConfetti && (
        <ConfettiView
          level={confettiLevel}
          startPosition={confettiPosition}
          onComplete={() => setShowConfetti(false)}
        />
      )}
      <div className="relative w-[420px] h-[600px]">
      {/* Arrow pointing up to tray icon */}
      <div className="absolute -top-2 right-12 w-4 h-4 bg-[rgba(20,25,30,0.85)] border-l border-t border-subtle rotate-45" />

      {/* Main popover container */}
      <div className="relative h-full rounded-xl glass-dark border border-subtle shadow-2xl flex flex-col overflow-hidden">
        {/* Header with Tria logo and level tabs */}
        <div className="border-b border-subtle" data-tauri-drag-region>
          <div className="flex items-center justify-between px-3 py-2">
            <h1 className="text-2xl font-bold text-primary">Tria</h1>

            {/* Level tabs */}
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as GoalLevel[]).map((level) => (
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
                  {t(`levels.${level}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {bottomTab === 'goals' && (
            <div className="px-3 py-2 space-y-2">
              {/* Goals list */}
              {currentGoals.map((goal, index) => (
                <NumberedGoalRow
                  key={goal.id}
                  number={index + 1}
                  goal={goal}
                  level={selectedLevel}
                  onToggle={(position) => handleToggle(goal.id, position)}
                />
              ))}

              {/* Add goal field */}
              {canAdd && (
                <div className="pt-1">
                  <AddGoalField
                    level={selectedLevel}
                    nextNumber={currentGoals.length + 1}
                    onAdd={handleAddGoal}
                  />
                </div>
              )}
            </div>
          )}
          {bottomTab === 'reflection' && (
            <ReflectionView
              level={selectedLevel}
              onClose={() => setBottomTab('goals')}
            />
          )}
          {bottomTab === 'history' && <HistoryView />}
          {bottomTab === 'settings' && <SettingsView />}
        </div>

        {/* Bottom navigation bar */}
        <div className="border-t border-subtle bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-around p-2">
            <button
              onClick={() => setBottomTab('goals')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                bottomTab === 'goals' ? 'text-primary' : 'text-secondary hover:text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-sm">{t('navigation.goals')}</span>
              </div>
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
                <span className="text-sm">{t('navigation.reflection')}</span>
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
                <span className="text-sm">{t('navigation.history')}</span>
              </div>
            </button>

            <button
              onClick={() => setBottomTab('settings')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                bottomTab === 'settings' ? 'text-primary' : 'text-secondary hover:text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm">{t('navigation.settings')}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
