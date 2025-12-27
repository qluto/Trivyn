import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { useGoalStore } from '../../store/goalStore';
import { GoalLevel } from '../../types';
import HistoryView from './HistoryView';
import ReflectionView from './ReflectionView';
import SettingsView from './SettingsView';
import NumberedGoalRow from '../floating/NumberedGoalRow';
import AddGoalField from '../floating/AddGoalField';
import ConfettiView from '../common/ConfettiView';

type BottomTab = 'goals' | 'reflection' | 'history' | 'settings';

// Page heights for different tabs
const PAGE_HEIGHTS: Record<BottomTab, number> = {
  goals: 400,
  history: 720,
  reflection: 700,
  settings: 650,
};

export default function MenuBarPopover() {
  const { t } = useTranslation();
  const [selectedLevel, setSelectedLevel] = useState<GoalLevel>('daily');
  const [bottomTab, setBottomTab] = useState<BottomTab>('goals');
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiLevel, setConfettiLevel] = useState<GoalLevel>('daily');
  const [confettiPosition, setConfettiPosition] = useState({ x: 0, y: 0 });
  const [historyHeight, setHistoryHeight] = useState(720); // Dynamic height for history view
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

  // Resize window when tab changes or history height changes
  useEffect(() => {
    const resizeWindow = async () => {
      try {
        const height = bottomTab === 'history' ? historyHeight : PAGE_HEIGHTS[bottomTab];
        console.log(`[MenuBarPopover] Resizing to ${height}px for tab: ${bottomTab}`);
        console.log(`[MenuBarPopover] Window size before: ${window.innerWidth}x${window.innerHeight}`);
        await invoke('resize_popover', { height });
        // Wait a bit for the resize to take effect
        setTimeout(() => {
          console.log(`[MenuBarPopover] Window size after: ${window.innerWidth}x${window.innerHeight}`);
        }, 100);
      } catch (error) {
        console.error('Failed to resize window:', error);
      }
    };
    resizeWindow();
  }, [bottomTab, historyHeight]);

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
      <div className="relative w-[420px] h-full">
      {/* Arrow pointing up to tray icon */}
      <div className="absolute -top-2 right-12 w-4 h-4 bg-[rgba(20,25,30,0.85)] border-l border-t border-subtle rotate-45" />

      {/* Main popover container */}
      <div className="relative rounded-xl glass-dark border border-subtle shadow-2xl flex flex-col overflow-hidden">
        {/* Header with Tria logo and main navigation */}
        <div className="border-b border-subtle" data-tauri-drag-region>
          <div className="flex items-center justify-between px-3 py-2">
            <h1 className="text-2xl font-bold text-primary">Tria</h1>

            {/* Main navigation tabs */}
            <div className="flex gap-1">
              <button
                onClick={() => setBottomTab('goals')}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${bottomTab === 'goals'
                    ? 'bg-white/15 text-primary'
                    : 'text-secondary hover:bg-white/5 hover:text-primary'
                  }
                `}
              >
                {t('navigation.goals')}
              </button>
              <button
                onClick={() => setBottomTab('history')}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${bottomTab === 'history'
                    ? 'bg-white/15 text-primary'
                    : 'text-secondary hover:bg-white/5 hover:text-primary'
                  }
                `}
              >
                {t('navigation.history')}
              </button>
              <button
                onClick={() => setBottomTab('reflection')}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${bottomTab === 'reflection'
                    ? 'bg-white/15 text-primary'
                    : 'text-secondary hover:bg-white/5 hover:text-primary'
                  }
                `}
              >
                {t('navigation.reflection')}
              </button>
              <button
                onClick={() => setBottomTab('settings')}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${bottomTab === 'settings'
                    ? 'bg-white/15 text-primary'
                    : 'text-secondary hover:bg-white/5 hover:text-primary'
                  }
                `}
              >
                {t('navigation.settings')}
              </button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="overflow-y-auto">
          {bottomTab === 'goals' && (
            <div className="flex flex-col">
              {/* Level tabs for goals */}
              <div className="border-b border-subtle px-3 py-2">
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'monthly'] as GoalLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={`
                        flex-1 px-4 py-1.5 rounded-lg text-sm font-medium
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

              {/* Goals list */}
              <div className="px-3 py-2 pb-4 space-y-2">
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
            </div>
          )}
          {bottomTab === 'reflection' && <ReflectionView />}
          {bottomTab === 'history' && <HistoryView onHeightChange={setHistoryHeight} />}
          {bottomTab === 'settings' && <SettingsView />}
        </div>
      </div>
      </div>
    </>
  );
}
