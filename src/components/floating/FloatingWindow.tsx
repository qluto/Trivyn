import { useState, useEffect, useRef } from 'react';
import { useGoalStore } from '../../store/goalStore';
import { GoalLevel } from '../../types';
import LevelSwitcher from './LevelSwitcher';
import NumberedGoalRow from './NumberedGoalRow';
import AddGoalField from './AddGoalField';
import EmptyState from './EmptyState';
import ConfettiView from '../common/ConfettiView';
import { invoke } from '@tauri-apps/api/core';

export default function FloatingWindow() {
  const [selectedLevel, setSelectedLevel] = useState<GoalLevel>('daily');
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiLevel, setConfettiLevel] = useState<GoalLevel>('daily');
  const [confettiPosition, setConfettiPosition] = useState({ x: 0, y: 0 });
  const { goals, loadGoals, addGoal, toggleGoalCompletion, canAddGoal, setupEventListeners } = useGoalStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGoals();
    setupEventListeners();
  }, [loadGoals, setupEventListeners]);

  // Reset confetti when changing tabs
  useEffect(() => {
    setShowConfetti(false);
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
      {showConfetti && (
        <ConfettiView
          level={confettiLevel}
          startPosition={confettiPosition}
          onComplete={() => setShowConfetti(false)}
        />
      )}
      <div
        ref={containerRef}
        className="relative w-[220px] rounded-xl glass-dark border border-subtle shadow-2xl overflow-hidden select-none"
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
      <div className="h-px bg-white/10 mx-1" data-tauri-drag-region />

      {/* Goals List */}
      <div className="px-1 py-1 space-y-0" data-tauri-drag-region>
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
                   bg-white/10 backdrop-blur-sm
                   flex items-center justify-center
                   opacity-0 hover:opacity-100 transition-opacity
                   group z-10"
        onClick={handleClose}
      >
        <span className="text-xs text-white/70 group-hover:text-white">✕</span>
      </button>
      </div>
    </>
  );
}
