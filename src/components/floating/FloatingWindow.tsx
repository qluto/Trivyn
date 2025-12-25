import { useState, useEffect } from 'react';
import { useGoalStore } from '../../store/goalStore';
import { GoalLevel } from '../../types';
import LevelSwitcher from './LevelSwitcher';
import NumberedGoalRow from './NumberedGoalRow';
import AddGoalField from './AddGoalField';
import EmptyState from './EmptyState';

export default function FloatingWindow() {
  const [selectedLevel, setSelectedLevel] = useState<GoalLevel>('daily');
  const { goals, loadGoals, addGoal, toggleGoalCompletion, canAddGoal } = useGoalStore();

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const currentGoals = goals.filter((g) => g.level === selectedLevel);
  const canAdd = canAddGoal(selectedLevel);

  const handleAddGoal = async (title: string) => {
    try {
      await addGoal(title, selectedLevel);
    } catch (error) {
      console.error('Failed to add goal:', error);
    }
  };

  const handleToggle = async (goalId: string) => {
    await toggleGoalCompletion(goalId);
  };

  const handleClose = async () => {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().hide();
  };

  const goalsCount = {
    daily: goals.filter((g) => g.level === 'daily').length,
    weekly: goals.filter((g) => g.level === 'weekly').length,
    monthly: goals.filter((g) => g.level === 'monthly').length,
  };

  return (
    <div
      className="relative w-[280px] min-h-[200px] max-h-[500px] rounded-xl glass-dark border border-subtle shadow-2xl overflow-hidden"
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
      <div className="h-px bg-white/10 mx-2" data-tauri-drag-region />

      {/* Goals List */}
      <div className="p-2 space-y-0.5" data-tauri-drag-region>
        {currentGoals.length === 0 ? (
          <EmptyState level={selectedLevel} />
        ) : (
          currentGoals.map((goal, index) => (
            <NumberedGoalRow
              key={goal.id}
              number={index + 1}
              goal={goal}
              level={selectedLevel}
              onToggle={() => handleToggle(goal.id)}
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
  );
}
