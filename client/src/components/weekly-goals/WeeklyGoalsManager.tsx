import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Target } from 'lucide-react';
import { useAppStore, useWeeklyGoals } from '@/stores/appStore';
import { api } from '@/lib/api';
import { WeeklyGoalResponse, DailyTaskResponse } from '@/lib/types';
import { WeeklyGoalCard } from './WeeklyGoalCard';
import { WeeklyGoalForm } from './WeeklyGoalForm';
import { DailyTaskForm } from './DailyTaskForm';

interface WeeklyGoalsManagerProps {
  goalId: string;
  goalTitle?: string;
}

export function WeeklyGoalsManager({ goalId, goalTitle }: WeeklyGoalsManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showWeeklyGoalDialog, setShowWeeklyGoalDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingWeeklyGoal, setEditingWeeklyGoal] = useState<WeeklyGoalResponse | null>(null);
  const [editingTask, setEditingTask] = useState<DailyTaskResponse | null>(null);
  const [selectedWeeklyGoalId, setSelectedWeeklyGoalId] = useState<string | null>(null);

  // Zustand store (subscribe to broad slices, filter locally to avoid unstable selectors)
  const allWeeklyGoals = useWeeklyGoals();

  // Memoized sorted data to keep render stable
  const weeklyGoals = useMemo(
    () => allWeeklyGoals.filter(wg => wg.goalId === goalId).slice().sort((a, b) => (a.weekNumber || 0) - (b.weekNumber || 0)),
    [allWeeklyGoals, goalId]
  );
  // No overview/daily tabs; we keep only Weekly Goals grid. Task dialog is available globally below.
  // Select individual actions to avoid subscribing to full store object
  const addWeeklyGoal = useAppStore(s => s.addWeeklyGoal);
  const updateWeeklyGoal = useAppStore(s => s.updateWeeklyGoal);
  const removeWeeklyGoal = useAppStore(s => s.removeWeeklyGoal);
  const addDailyTask = useAppStore(s => s.addDailyTask);
  const updateDailyTask = useAppStore(s => s.updateDailyTask);
  const removeDailyTask = useAppStore(s => s.removeDailyTask);
  // Also subscribe to dailyTasks slice so task toggles trigger re-render
  const allDailyTasks = useAppStore(s => s.dailyTasks);

  // Load weekly goals on mount
  useEffect(() => {
    loadWeeklyGoals();
  }, [goalId]);

  const loadWeeklyGoals = async () => {
    try {
      setIsLoading(true);
      // Get detailed goal which includes weekly goals and tasks
      const detailedGoal = await api.getGoal(goalId);
      // Update store with the loaded data
      const store = useAppStore.getState();
      store.setWeeklyGoals(detailedGoal.weeklyGoals.flatMap(wg =>
        wg.tasks ? [wg] : [wg]
      ));
      store.setDailyTasks(detailedGoal.weeklyGoals.flatMap(wg =>
        wg.tasks || []
      ));
    } catch (error) {
      console.error('Failed to load weekly goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Weekly Goal CRUD Operations
  const handleCreateWeeklyGoal = async (data: {
    title: string;
    description?: string;
    weekNumber: number;
    startDate: string;
    endDate: string;
  }) => {
    try {
      setIsLoading(true);
      const newWeeklyGoal = await api.createWeeklyGoal(goalId, data);
      addWeeklyGoal(newWeeklyGoal);
      setShowWeeklyGoalDialog(false);
    } catch (error) {
      console.error('Failed to create weekly goal:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWeeklyGoal = async (weeklyGoalId: string, updates: Partial<WeeklyGoalResponse>) => {
    try {
      setIsLoading(true);
      const updated = await api.updateWeeklyGoal(goalId, weeklyGoalId, updates);
      updateWeeklyGoal(weeklyGoalId, updated);
      setEditingWeeklyGoal(null);
      setShowWeeklyGoalDialog(false);
    } catch (error) {
      console.error('Failed to update weekly goal:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWeeklyGoal = async (weeklyGoalId: string) => {
    try {
      setIsLoading(true);
      await api.deleteWeeklyGoal(goalId, weeklyGoalId);
      removeWeeklyGoal(weeklyGoalId);
    } catch (error) {
      console.error('Failed to delete weekly goal:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Daily Task CRUD Operations
  const handleCreateDailyTask = async (weeklyGoalId: string, data: {
    title: string;
    description?: string;
    day: number;
    date?: string;
    priority?: 'low' | 'medium' | 'high';
    estimatedHours?: number;
  }) => {
    try {
      setIsLoading(true);
      const newTask = await api.createDailyTask(goalId, weeklyGoalId, data);
      addDailyTask(newTask);
      setShowTaskDialog(false);
    } catch (error) {
      console.error('Failed to create daily task:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDailyTask = async (taskId: string, updates: Partial<DailyTaskResponse>) => {
    try {
      setIsLoading(true);
      // Use flat task endpoint that backend provides: PATCH /api/tasks/{task_id}
      const updated = await api.updateTask(taskId, {
        title: updates.title,
        description: updates.description,
        completed: updates.completed,
        priority: updates.priority,
        estimatedHours: updates.estimatedHours,
        date: updates.date
      });
      updateDailyTask(taskId, updated);
      setEditingTask(null);
      setShowTaskDialog(false);
    } catch (error) {
      console.error('Failed to update daily task:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDailyTask = async (taskId: string) => {
    try {
      setIsLoading(true);
      await api.deleteDailyTask(goalId, taskId);
      removeDailyTask(taskId);
    } catch (error) {
      console.error('Failed to delete daily task:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    // Optimistic store update for immediate UI feedback
    const store = useAppStore.getState();
    const prevTask = store.dailyTasks.find(t => t.id === taskId);
    const prevWeekly = prevTask ? store.weeklyGoals.find(w => w.id === prevTask.weeklyGoalId) : undefined;
    const prevGoal = prevTask ? store.goals.find(g => g.id === prevTask.goalId) : undefined;

    // Helper: recompute progress for a weekly goal from current store dailyTasks
    const recomputeWeeklyProgress = (weeklyGoalId?: string): number => {
      if (!weeklyGoalId) return 0;
      const tasks = store.dailyTasks.filter(t => t.weeklyGoalId === weeklyGoalId);
      const total = tasks.length;
      const done = tasks.filter(t => t.completed).length;
      return total > 0 ? (done / total) * 100 : 0;
    };
    // Helper: recompute parent goal progress as average of its weekly goals' progress
    const recomputeGoalProgress = (goalId?: string): number => {
      if (!goalId) return prevGoal?.progress || 0;
      const wgs = store.weeklyGoals.filter(w => w.goalId === goalId);
      if (wgs.length === 0) return 0;
      const sum = wgs.reduce((acc, w) => acc + (w.progress || 0), 0);
      return Math.round((sum / wgs.length) * 100) / 100;
    };

    // 1) Optimistically update the task
    store.updateDailyTask(taskId, { completed });
    // 2) Optimistically update the weekly goal progress
    if (prevTask?.weeklyGoalId) {
      const newWgProgress = recomputeWeeklyProgress(prevTask.weeklyGoalId);
      store.updateWeeklyGoal(prevTask.weeklyGoalId, { progress: newWgProgress });
    }
    // 3) Optimistically update the parent goal progress
    if (prevTask?.goalId) {
      const newGoalProgress = recomputeGoalProgress(prevTask.goalId);
      store.updateGoal(prevTask.goalId, { progress: newGoalProgress });
    }

    try {
      await handleUpdateDailyTask(taskId, { completed });
      // After success, recompute again in case server made adjustments
      if (prevTask?.weeklyGoalId) {
        const newWgProgress = recomputeWeeklyProgress(prevTask.weeklyGoalId);
        store.updateWeeklyGoal(prevTask.weeklyGoalId, { progress: newWgProgress });
      }
      if (prevTask?.goalId) {
        const newGoalProgress = recomputeGoalProgress(prevTask.goalId);
        store.updateGoal(prevTask.goalId, { progress: newGoalProgress });
      }
    } catch (error) {
      // Rollback on error
      if (prevTask) {
        store.updateDailyTask(taskId, { completed: prevTask.completed });
      }
      if (prevWeekly?.id) {
        store.updateWeeklyGoal(prevWeekly.id, { progress: prevWeekly.progress });
      }
      if (prevGoal?.id) {
        store.updateGoal(prevGoal.id, { progress: prevGoal.progress });
      }
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Weekly Goals
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={showWeeklyGoalDialog} onOpenChange={setShowWeeklyGoalDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Weekly Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-lg p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle>
                  {editingWeeklyGoal ? 'Edit Weekly Goal' : 'Create Weekly Goal'}
                </DialogTitle>
              </DialogHeader>
              <WeeklyGoalForm
                weeklyGoal={editingWeeklyGoal}
                onSubmit={editingWeeklyGoal
                  ? (data: {
                      title: string;
                      description?: string;
                      weekNumber: number;
                      startDate: string;
                      endDate: string;
                    }) => handleUpdateWeeklyGoal(editingWeeklyGoal.id!, data)
                  : handleCreateWeeklyGoal
                }
                onCancel={() => {
                  setShowWeeklyGoalDialog(false);
                  setEditingWeeklyGoal(null);
                }}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Top-level Daily Task dialog (accessible from Weekly Goals grid) */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Edit Daily Task' : 'Create Daily Task'}
            </DialogTitle>
          </DialogHeader>
          <DailyTaskForm
            task={editingTask}
            weeklyGoalId={selectedWeeklyGoalId || ''}
            onSubmit={editingTask
              ? (data: {
                  title: string;
                  description?: string;
                  day: number;
                  date?: string;
                  priority?: 'low' | 'medium' | 'high';
                  estimatedHours?: number;
                }) => handleUpdateDailyTask(editingTask.id!, data)
              : async (data: {
                  title: string;
                  description?: string;
                  day: number;
                  date?: string;
                  priority?: 'low' | 'medium' | 'high';
                  estimatedHours?: number;
                }) => {
                  if (!selectedWeeklyGoalId) return;
                  await handleCreateDailyTask(selectedWeeklyGoalId, data);
                }
            }
            onCancel={() => {
              setShowTaskDialog(false);
              setEditingTask(null);
            }}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Weekly Goals grid only */}
      {weeklyGoals.length === 0 ? (
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Weekly Goals Yet</h3>
          <p className="text-muted-foreground mb-4">
            Break down your goal into manageable weekly milestones.
          </p>
          <Button className="w-full sm:w-auto" onClick={() => setShowWeeklyGoalDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Weekly Goal
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {weeklyGoals.map((weeklyGoal) => (
            <WeeklyGoalCard
              key={weeklyGoal.id}
              weeklyGoal={{
                ...weeklyGoal,
                tasks: allDailyTasks.filter(t => t.weeklyGoalId === weeklyGoal.id)
              }}
              onEdit={(wg) => {
                setEditingWeeklyGoal(wg);
                setShowWeeklyGoalDialog(true);
              }}
              onDelete={handleDeleteWeeklyGoal}
              onAddTask={(weeklyGoalId) => {
                setSelectedWeeklyGoalId(weeklyGoalId);
                setEditingTask(null);
                setShowTaskDialog(true);
              }}
              onTaskToggle={handleTaskToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
