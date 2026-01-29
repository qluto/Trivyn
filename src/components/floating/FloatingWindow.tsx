import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGoalStore } from '../../store/goalStore';
import { useSettingsStore } from '../../store/settingsStore';
import { GoalLevel } from '../../types';
import LevelSwitcher from './LevelSwitcher';
import NumberedGoalRow from './NumberedGoalRow';
import AddGoalField from './AddGoalField';
import EmptyState from './EmptyState';
import ConfettiView from '../common/ConfettiView';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export default function FloatingWindow() {
  const { i18n: i18nInstance } = useTranslation();
  const [selectedLevel, setSelectedLevel] = useState<GoalLevel>('daily');
  const [confettiState, setConfettiState] = useState<{
    show: boolean;
    goalId: string;
    level: GoalLevel;
    position: { x: number; y: number };
  } | null>(null);
  const {
    goals,
    loadGoals,
    addGoal,
    toggleGoalCompletion,
    canAddGoal,
    setupEventListeners,
    setWeekStart,
    getDailyGoals,
    getWeeklyGoals,
    getMonthlyGoals
  } = useGoalStore();
  const { loadSettings, weekStart } = useSettingsStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastCheckDateRef = useRef<string>(new Date().toDateString());

  // Sync weekStart from settings to goal store
  useEffect(() => {
    setWeekStart(weekStart);
  }, [weekStart, setWeekStart]);

  useEffect(() => {
    console.log('[FloatingWindow] Component mounted, loading goals, settings and setting up event listeners');
    loadGoals();
    loadSettings();
    const cleanup = setupEventListeners();
    return () => {
      console.log('[FloatingWindow] Component unmounting, cleaning up event listeners');
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
        console.log('[FloatingWindow] Date changed, reloading goals');
        lastCheckDateRef.current = currentDate;
        loadGoals();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [loadGoals]);

  // Listen for language changes from other windows
  useEffect(() => {
    const setupLanguageListener = async () => {
      const unlisten = await listen<{ language: string; i18nLanguage: string }>(
        'language-changed',
        async (event) => {
          console.log('[FloatingWindow] Language changed:', event.payload);
          await i18nInstance.changeLanguage(event.payload.i18nLanguage);
        }
      );
      return unlisten;
    };

    const cleanup = setupLanguageListener();
    return () => {
      cleanup.then(unlisten => {
        if (unlisten) unlisten();
      });
    };
  }, [i18nInstance]);

  // Reset confetti when changing tabs
  useEffect(() => {
    setConfettiState(null);
  }, [selectedLevel]);

  // Dynamically resize window based on content, preserving top position
  useEffect(() => {
    const resizeWindow = async () => {
      if (!containerRef.current) return;

      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(async () => {
        if (!containerRef.current) return;

        // Get actual content height
        const contentHeight = containerRef.current.scrollHeight;
        // Minimum height for empty state, max for 3 goals
        const newHeight = Math.max(60, Math.min(200, contentHeight));

        // Call Rust command to resize with top position fixed
        try {
          await invoke('resize_window_from_top', { newHeight });
        } catch (error) {
          console.error('Failed to resize window:', error);
        }
      });
    };

    resizeWindow();
  }, [goals, selectedLevel]);

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
      const updatedGoal = await toggleGoalCompletion(goalId);

      if (updatedGoal.isCompleted) {
        // 完了時：新しいconfettiを表示（前のconfettiは自動的に置き換わる）
        setConfettiState({
          show: true,
          goalId: updatedGoal.id,
          level: updatedGoal.level,
          position,
        });
      } else {
        // キャンセル時：同じゴールのconfettiが表示中であれば停止
        if (confettiState?.goalId === goalId) {
          setConfettiState(null);
        }
        // 異なるゴールのconfettiは継続（影響を与えない）
      }
    } catch (error) {
      console.error('Failed to toggle goal:', error);
    }
  };

  const handleClose = async () => {
    const { Window } = await import('@tauri-apps/api/window');
    await Window.getCurrent().hide();
  };

  const goalsCount = {
    daily: getDailyGoals().length,
    weekly: getWeeklyGoals().length,
    monthly: getMonthlyGoals().length,
  };

  return (
    <>
      {confettiState && confettiState.show && (
        <ConfettiView
          level={confettiState.level}
          startPosition={confettiState.position}
          onComplete={() => setConfettiState(null)}
        />
      )}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden glass-card select-none"
        data-tauri-drag-region
      >
        {/* Level Switcher */}
        <div data-tauri-drag-region>
          <LevelSwitcher
            selected={selectedLevel}
            onChange={setSelectedLevel}
            goalsCount={goalsCount}
          />
        </div>

        {/* Goals List - padding matches design [4,8,10,8] */}
        <div className="pt-1 px-2 pb-2.5 overflow-hidden" data-tauri-drag-region>
          {currentGoals.length === 0 ? (
            <EmptyState level={selectedLevel} />
          ) : (
            currentGoals.map((goal, index) => (
              <NumberedGoalRow
                key={goal.id}
                number={index + 1}
                goal={goal}
                level={selectedLevel}
                onToggle={(position) => handleToggle(goal.id, position)}
              />
            ))
          )}

          {/* Add new goal field */}
          {canAdd && (
            <AddGoalField
              level={selectedLevel}
              nextNumber={currentGoals.length + 1}
              onAdd={handleAddGoal}
            />
          )}
        </div>

        {/* Close button (hover to show) */}
        <button
          className="absolute top-2 right-2 w-6 h-6 rounded-full
                     bg-surface-elevated dark:bg-surface-dark-elevated
                     flex items-center justify-center
                     opacity-0 hover:opacity-100 transition-opacity
                     group z-10"
          onClick={handleClose}
        >
          <svg className="w-3 h-3 text-tertiary group-hover:text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </>
  );
}
