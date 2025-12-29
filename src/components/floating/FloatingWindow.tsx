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
  const { goals, loadGoals, addGoal, toggleGoalCompletion, canAddGoal, setupEventListeners } = useGoalStore();
  const { loadSettings } = useSettingsStore();
  const containerRef = useRef<HTMLDivElement>(null);

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

      // Calculate required height based on content
      const contentHeight = containerRef.current.scrollHeight;
      const newHeight = Math.max(80, Math.min(300, contentHeight));

      // Call Rust command to resize with top position fixed
      try {
        await invoke('resize_window_from_top', { newHeight });
      } catch (error) {
        console.error('Failed to resize window:', error);
      }
    };

    resizeWindow();
  }, [goals, selectedLevel]);

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
    daily: goals.filter((g) => g.level === 'daily').length,
    weekly: goals.filter((g) => g.level === 'weekly').length,
    monthly: goals.filter((g) => g.level === 'monthly').length,
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
        className="relative w-full h-full overflow-hidden glass-dark border border-subtle select-none"
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

      {/* Divider */}
      <div className="h-px bg-gray-900/10 dark:bg-white/10 mx-1" data-tauri-drag-region />

      {/* Goals List */}
      <div className="px-1 py-1 space-y-0 overflow-hidden" data-tauri-drag-region>
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
        className="absolute top-2 right-2 w-5 h-5 rounded-full
                   bg-gray-900/10 dark:bg-white/10 backdrop-blur-sm
                   flex items-center justify-center
                   opacity-0 hover:opacity-100 transition-opacity
                   group z-10"
        onClick={handleClose}
      >
        <span className="text-xs text-gray-900/70 dark:text-white/70 group-hover:text-gray-900 dark:group-hover:text-white">✕</span>
      </button>
      </div>
    </>
  );
}
