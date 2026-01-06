import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useGoalStore } from '../../store/goalStore';
import { useSettingsStore } from '../../store/settingsStore';
import { GoalLevel } from '../../types';
import HistoryView from './HistoryView';
import ReflectionView from './ReflectionView';
import SettingsView from './SettingsView';
import NumberedGoalRow from '../floating/NumberedGoalRow';
import AddGoalField from '../floating/AddGoalField';
import ConfettiView from '../common/ConfettiView';

type BottomTab = 'goals' | 'reflection' | 'history' | 'settings';

interface PeriodChangeEvent {
  has_weekly_change: boolean;
  has_monthly_change: boolean;
  current_week_key: string;
  current_month_key: string;
}

export default function MenuBarPopover() {
  const { t } = useTranslation();
  const [selectedLevel, setSelectedLevel] = useState<GoalLevel>('daily');
  const [bottomTab, setBottomTab] = useState<BottomTab>('goals');
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiLevel, setConfettiLevel] = useState<GoalLevel>('daily');
  const [confettiPosition, setConfettiPosition] = useState({ x: 0, y: 0 });
  const [goalsHeight, setGoalsHeight] = useState(400);
  const [reflectionHeight, setReflectionHeight] = useState(700);
  const [historyHeight, setHistoryHeight] = useState(720);
  const [settingsHeight, setSettingsHeight] = useState(650);
  const containerRef = useRef<HTMLDivElement>(null);
  const goalsContentRef = useRef<HTMLDivElement>(null);
  const lastCheckDateRef = useRef<string>(new Date().toDateString());
  const { goals, loadGoals, addGoal, toggleGoalCompletion, canAddGoal, deleteGoal, setupEventListeners, setWeekStart } = useGoalStore();
  const { loadSettings, weekStart } = useSettingsStore();

  // Sync weekStart from settings to goal store
  useEffect(() => {
    setWeekStart(weekStart);
  }, [weekStart, setWeekStart]);

  useEffect(() => {
    console.log('[MenuBarPopover] Component mounted, loading goals, settings and setting up event listeners');
    loadGoals();
    loadSettings();
    const cleanup = setupEventListeners();
    return () => {
      console.log('[MenuBarPopover] Component unmounting, cleaning up event listeners');
      cleanup.then(unlisten => {
        if (unlisten) unlisten();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for date changes and reload goals
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const currentDate = new Date().toDateString();
      if (currentDate !== lastCheckDateRef.current) {
        console.log('[MenuBarPopover] Date changed, reloading goals');
        lastCheckDateRef.current = currentDate;
        loadGoals();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [loadGoals]);

  // Reload goals when window becomes visible
  useEffect(() => {
    const setupVisibilityListener = async () => {
      const { Window } = await import('@tauri-apps/api/window');
      const currentWindow = Window.getCurrent();

      const unlisten = await currentWindow.onFocusChanged(({ payload: focused }: { payload: boolean }) => {
        if (focused) {
          console.log('[MenuBarPopover] Window focused, reloading goals');
          loadGoals();
        }
      });

      return unlisten;
    };

    const cleanup = setupVisibilityListener();
    return () => {
      cleanup.then(unlisten => {
        if (unlisten) unlisten();
      });
    };
  }, [loadGoals]);

  // Listen for reflection prompt trigger events
  useEffect(() => {
    const setupReflectionListener = async () => {
      const unlisten = await listen<PeriodChangeEvent>('reflection-prompt-trigger', (event) => {
        const { has_weekly_change } = event.payload;

        console.log('[MenuBarPopover] Received reflection-prompt-trigger event:', event.payload);

        // 週次優先でReflectionViewに切り替え
        if (has_weekly_change) {
          setBottomTab('reflection');
        }
      });

      return unlisten;
    };

    const cleanup = setupReflectionListener();
    return () => {
      cleanup.then(unlisten => {
        if (unlisten) unlisten();
      });
    };
  }, []);

  // Reset confetti when changing tabs (level or bottom tab)
  useEffect(() => {
    setShowConfetti(false);
  }, [selectedLevel, bottomTab]);

  // Measure goals content height
  useEffect(() => {
    if (bottomTab === 'goals' && goalsContentRef.current) {
      const height = goalsContentRef.current.scrollHeight;
      setGoalsHeight(height);
    }
  }, [bottomTab, goals, selectedLevel]);

  // Resize window when tab changes or content height changes
  useEffect(() => {
    const resizeWindow = async () => {
      try {
        // Only resize when window is visible
        const { Window } = await import('@tauri-apps/api/window');
        const currentWindow = Window.getCurrent();
        const isVisible = await currentWindow.isVisible();

        if (!isVisible) {
          console.log('[MenuBarPopover] Window not visible, skipping resize');
          return;
        }

        // Get height based on current tab
        const heightMap: Record<BottomTab, number> = {
          goals: goalsHeight,
          reflection: reflectionHeight,
          history: historyHeight,
          settings: settingsHeight,
        };

        const targetHeight = heightMap[bottomTab];

        // Add header height (approximately 60px for the Triskly header)
        const totalHeight = targetHeight + 60;

        console.log(`[MenuBarPopover] Resizing to ${totalHeight}px for tab: ${bottomTab}`);
        await invoke('resize_popover', { height: totalHeight });
      } catch (error) {
        console.error('Failed to resize window:', error);
      }
    };
    resizeWindow();
  }, [bottomTab, goalsHeight, reflectionHeight, historyHeight, settingsHeight]);

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

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId);
    } catch (error) {
      console.error('Failed to delete goal:', error);
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
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden glass-dark border border-subtle flex flex-col"
      >
        {/* Header with Triskly logo and main navigation */}
        <div className="border-b border-subtle" data-tauri-drag-region>
          <div className="flex items-center justify-between px-3 py-2">
            <h1 className="text-2xl font-bold text-primary">Triskly</h1>

            {/* Main navigation tabs */}
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
              <button
                onClick={() => setBottomTab('goals')}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${bottomTab === 'goals'
                    ? 'bg-gray-900/10 dark:bg-white/15 text-primary'
                    : 'text-secondary hover:bg-gray-900/5 dark:hover:bg-white/5 hover:text-primary'
                  }
                `}
              >
                {t('navigation.goals')}
              </button>
              <button
                onClick={() => setBottomTab('reflection')}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${bottomTab === 'reflection'
                    ? 'bg-gray-900/10 dark:bg-white/15 text-primary'
                    : 'text-secondary hover:bg-gray-900/5 dark:hover:bg-white/5 hover:text-primary'
                  }
                `}
              >
                {t('navigation.reflection')}
              </button>
              <button
                onClick={() => setBottomTab('history')}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${bottomTab === 'history'
                    ? 'bg-gray-900/10 dark:bg-white/15 text-primary'
                    : 'text-secondary hover:bg-gray-900/5 dark:hover:bg-white/5 hover:text-primary'
                  }
                `}
              >
                {t('navigation.history')}
              </button>
              <button
                onClick={() => setBottomTab('settings')}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${bottomTab === 'settings'
                    ? 'bg-gray-900/10 dark:bg-white/15 text-primary'
                    : 'text-secondary hover:bg-gray-900/5 dark:hover:bg-white/5 hover:text-primary'
                  }
                `}
              >
                {t('navigation.settings')}
              </button>
              </div>

              {/* Close button */}
              <button
                onClick={async () => {
                  const { Window } = await import('@tauri-apps/api/window');
                  const currentWindow = Window.getCurrent();
                  await currentWindow.hide();
                }}
                className="p-1.5 rounded-lg text-secondary hover:bg-gray-900/5 dark:hover:bg-white/5 hover:text-primary transition-all duration-200"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="overflow-hidden">
          {bottomTab === 'goals' && (
            <div ref={goalsContentRef} className="flex flex-col">
              {/* Level tabs for goals */}
              <div className="border-b border-subtle px-3 py-2">
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'monthly'] as GoalLevel[]).map((level) => {
                    const count = goals.filter((g) => g.level === level).length;
                    const completedCount = goals.filter((g) => g.level === level && g.isCompleted).length;
                    const levelColors: Record<GoalLevel, string> = {
                      daily: 'bg-daily-accent',
                      weekly: 'bg-weekly-accent',
                      monthly: 'bg-monthly-accent',
                    };

                    return (
                      <button
                        key={level}
                        onClick={() => setSelectedLevel(level)}
                        className={`
                          flex-1 px-4 py-1.5 rounded-lg text-sm font-medium
                          transition-all duration-200 flex items-center justify-center gap-1.5
                          ${selectedLevel === level
                            ? 'bg-gray-900/10 dark:bg-white/15 text-primary'
                            : 'text-secondary hover:bg-gray-900/5 dark:hover:bg-white/5 hover:text-primary'
                          }
                        `}
                      >
                        {/* Progress dots */}
                        <div className="flex gap-0.5">
                          {[0, 1, 2].map((index) => (
                            <div
                              key={index}
                              className={`
                                w-1.5 h-1.5 rounded-full transition-all
                                ${index < count
                                  ? index < completedCount
                                    ? levelColors[level]
                                    : 'bg-gray-900/30 dark:bg-white/30'
                                  : 'bg-gray-900/10 dark:bg-white/10'
                                }
                              `}
                            />
                          ))}
                        </div>

                        {t(`levels.${level}`)}
                      </button>
                    );
                  })}
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
                    onDelete={() => handleDeleteGoal(goal.id)}
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
          {bottomTab === 'reflection' && <ReflectionView onHeightChange={setReflectionHeight} />}
          {bottomTab === 'history' && <HistoryView onHeightChange={setHistoryHeight} />}
          {bottomTab === 'settings' && <SettingsView onHeightChange={setSettingsHeight} />}
        </div>
      </div>
    </>
  );
}
