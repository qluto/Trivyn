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

// Navigation icons (14x14 to match design)
const HomeIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const BookIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Logo icon component (30x30 to match design) - Three Wins checkmark logo
const LogoIcon = () => (
  <div
    className="flex items-center justify-center"
    style={{
      width: '30px',
      height: '30px',
      borderRadius: '10px',
      background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)'
    }}
  >
    <svg className="w-4 h-4" viewBox="0 0 512 512" fill="none">
      <g transform="translate(256, 256) rotate(20)">
        <g stroke="#ffffff" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round">
          <g transform="rotate(0) translate(0, -95)">
            <path d="M-60,12 L-12,60 L84,-84" />
          </g>
          <g transform="rotate(120) translate(0, -95)">
            <path d="M-60,12 L-12,60 L84,-84" />
          </g>
          <g transform="rotate(240) translate(0, -95)">
            <path d="M-60,12 L-12,60 L84,-84" />
          </g>
        </g>
      </g>
    </svg>
  </div>
);

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
  const {
    goals,
    loadGoals,
    addGoal,
    toggleGoalCompletion,
    canAddGoal,
    deleteGoal,
    setupEventListeners,
    setWeekStart,
    getDailyGoals,
    getWeeklyGoals,
    getMonthlyGoals
  } = useGoalStore();
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

        // Add header height (approximately 60px for the Trivyn header)
        const totalHeight = targetHeight + 60;

        console.log(`[MenuBarPopover] Resizing to ${totalHeight}px for tab: ${bottomTab}`);
        await invoke('resize_popover', { height: totalHeight });
      } catch (error) {
        console.error('Failed to resize window:', error);
      }
    };
    resizeWindow();
  }, [bottomTab, goalsHeight, reflectionHeight, historyHeight, settingsHeight]);

  const currentGoals = selectedLevel === 'daily' ? getDailyGoals()
    : selectedLevel === 'weekly' ? getWeeklyGoals()
    : getMonthlyGoals();
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

  const navItems: { tab: BottomTab; icon: () => JSX.Element }[] = [
    { tab: 'goals', icon: HomeIcon },
    { tab: 'history', icon: CalendarIcon },
    { tab: 'reflection', icon: BookIcon },
    { tab: 'settings', icon: SettingsIcon },
  ];

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
        className="relative w-full h-full overflow-hidden glass-card flex flex-col"
      >
        {/* Header with Trivyn logo and icon navigation - 56px height */}
        <div
          className="border-b border-border-subtle dark:border-gray-700"
          style={{ height: '56px' }}
          data-tauri-drag-region
        >
          <div className="flex items-center justify-between h-full px-4">
            {/* Logo and title */}
            <div className="flex items-center gap-2">
              <LogoIcon />
              <h1 className="text-[17px] font-extrabold text-primary tracking-wide">Trivyn</h1>
            </div>

            {/* Icon navigation - 28x28 buttons with 8px gap */}
            <div className="flex items-center gap-2">
              {navItems.map(({ tab, icon: Icon }) => (
                <button
                  key={tab}
                  onClick={() => setBottomTab(tab)}
                  className={`
                    flex items-center justify-center rounded-lg transition-all duration-200
                    ${bottomTab === tab
                      ? 'text-white'
                      : 'text-secondary hover:text-primary bg-surface-elevated dark:bg-surface-dark-elevated'
                    }
                  `}
                  style={{
                    width: '28px',
                    height: '28px',
                    background: bottomTab === tab ? 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' : undefined
                  }}
                  aria-label={t(`navigation.${tab}`)}
                >
                  <Icon />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          {bottomTab === 'goals' && (
            <div ref={goalsContentRef} className="flex flex-col">
              {/* Level tabs for goals */}
              <div className="px-4 py-3">
                <div className="flex gap-1 p-1 bg-surface-elevated/50 dark:bg-surface-dark-elevated/50 rounded-lg">
                  {(['daily', 'weekly', 'monthly'] as GoalLevel[]).map((level) => {
                    const isSelected = selectedLevel === level;
                    return (
                      <button
                        key={level}
                        onClick={() => setSelectedLevel(level)}
                        className={`tab-pill flex-1 ${isSelected ? 'active' : ''}`}
                      >
                        {t(`levels.${level}`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Goals list - padding 16px to match design */}
              <div className="px-4 pb-4">
                {currentGoals.map((goal, index) => (
                  <NumberedGoalRow
                    key={goal.id}
                    number={index + 1}
                    goal={goal}
                    level={selectedLevel}
                    onToggle={(position) => handleToggle(goal.id, position)}
                    onDelete={() => handleDeleteGoal(goal.id)}
                    size="default"
                  />
                ))}

                {/* Add goal field */}
                {canAdd && (
                  <AddGoalField
                    level={selectedLevel}
                    nextNumber={currentGoals.length + 1}
                    onAdd={handleAddGoal}
                    size="default"
                  />
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
