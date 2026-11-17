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
import ParentGoalsContext from '../common/ParentGoalsContext';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useWindowDrag } from '../../hooks/useWindowDrag';

// ウィンドウ高さの上限。tauri.conf.json の main ウィンドウ maxHeight と揃えること
const MAX_WINDOW_HEIGHT = 480;

export default function FloatingWindow() {
  const { t, i18n: i18nInstance } = useTranslation();
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
    getMonthlyGoals,
    getParentGoals,
    getChildStats
  } = useGoalStore();
  const { loadSettings, weekStart } = useSettingsStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastCheckDateRef = useRef<string>(new Date().toDateString());

  // 操作要素以外のどこを掴んでもウィンドウを移動できる
  useWindowDrag(containerRef);

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

  // Dynamically resize window based on content, preserving top position.
  // ResizeObserver covers all layout changes (goals, level switch, context
  // strip collapse, parent chips) without enumerating them as deps.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeWindow = () => {
      requestAnimationFrame(async () => {
        if (!containerRef.current) return;

        const contentHeight = containerRef.current.scrollHeight;
        // Minimum height for empty state, max for 3 goals + expanded parent context.
        // 上限超過時はコンテナ側の overflow-y-auto でスクロールできる
        const newHeight = Math.max(60, Math.min(MAX_WINDOW_HEIGHT, contentHeight));

        try {
          await invoke('resize_window_from_top', { newHeight });
        } catch (error) {
          console.error('Failed to resize window:', error);
        }
      });
    };

    resizeWindow();
    const resizeObserver = new ResizeObserver(resizeWindow);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const currentGoals = selectedLevel === 'daily' ? getDailyGoals()
    : selectedLevel === 'weekly' ? getWeeklyGoals()
    : getMonthlyGoals();
  const canAdd = canAddGoal(selectedLevel);
  const parentGoals = getParentGoals(selectedLevel);

  const handleAddGoal = async (title: string, parentGoalId?: string | null) => {
    try {
      await addGoal(title, selectedLevel, parentGoalId);
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

  const handleClose = () => {
    getCurrentWindow()
      .hide()
      .catch((error) => console.error('Failed to hide window:', error));
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
        className="group/win relative w-full max-h-screen overflow-y-auto overflow-x-hidden glass-card select-none"
      >
        {/* Grip bar: 掴んで移動するための専用領域。スクロール時も上端に残す */}
        <div
          className="sticky top-0 z-10 h-4 flex items-center justify-center cursor-grab active:cursor-grabbing"
          title={t('floating.dragHint')}
        >
          <span
            aria-hidden="true"
            className="w-8 h-[3px] rounded-full bg-border dark:bg-gray-600 opacity-60 group-hover/win:opacity-100 transition-opacity"
          />

          {/* Close (hide) button: 見た目14px・当たり判定20px */}
          <button
            type="button"
            onClick={handleClose}
            aria-label={t('floating.hide')}
            title={t('floating.hide')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full
                       flex items-center justify-center cursor-default
                       before:absolute before:-inset-[3px] before:rounded-full
                       text-tertiary dark:text-content-dark-tertiary
                       hover:text-primary hover:bg-surface-elevated dark:hover:bg-surface-dark-elevated
                       opacity-30 group-hover/win:opacity-100 focus-visible:opacity-100 transition-opacity
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Level Switcher */}
        <LevelSwitcher
          selected={selectedLevel}
          onChange={setSelectedLevel}
          goalsCount={goalsCount}
        />

        {/* Parent-level goals context (daily -> weekly, weekly -> monthly) */}
        <ParentGoalsContext
          level={selectedLevel}
          onNavigate={setSelectedLevel}
          size="compact"
          className="mx-2 mt-0.5"
        />

        {/* Goals List - padding matches design [4,8,10,8] */}
        <div className="pt-1 px-2 pb-2.5 overflow-hidden">
          {currentGoals.length === 0 ? (
            <EmptyState level={selectedLevel} />
          ) : (
            currentGoals.map((goal, index) => (
              <NumberedGoalRow
                key={goal.id}
                number={index + 1}
                goal={goal}
                level={selectedLevel}
                parentGoal={goal.parentGoalId ? goals.find((g) => g.id === goal.parentGoalId) ?? null : null}
                childStats={getChildStats(goal.id)}
                onToggle={(position) => handleToggle(goal.id, position)}
              />
            ))
          )}

          {/* Add new goal field */}
          {canAdd && (
            <AddGoalField
              level={selectedLevel}
              nextNumber={currentGoals.length + 1}
              parentGoals={parentGoals}
              onAdd={handleAddGoal}
            />
          )}
        </div>

      </div>
    </>
  );
}
