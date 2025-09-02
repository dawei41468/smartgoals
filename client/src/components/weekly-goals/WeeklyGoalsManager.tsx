import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Target, Calendar, BarChart3 } from 'lucide-react';
import { useAppStore, useWeeklyGoalsForGoal, useDailyTasksForWeeklyGoal } from '@/stores/appStore';
import { api } from '@/lib/api';
import { WeeklyGoalResponse, DailyTaskResponse } from '@/lib/types';
import { WeeklyGoalCard } from './WeeklyGoalCard';
import { DailyTaskCard } from './DailyTaskCard';
import { WeeklyGoalForm } from './WeeklyGoalForm';
import { DailyTaskForm } from './DailyTaskForm';
import { WeeklyGoalsOverview } from './WeeklyGoalsOverview';

interface WeeklyGoalsManagerProps {
  goalId: string;
  goalTitle?: string;
}

export function WeeklyGoalsManager({ goalId, goalTitle }: WeeklyGoalsManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showWeeklyGoalDialog, setShowWeeklyGoalDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingWeeklyGoal, setEditingWeeklyGoal] = useState<WeeklyGoalResponse | null>(null);
  const [editingTask, setEditingTask] = useState<DailyTaskResponse | null>(null);
  const [selectedWeeklyGoalId, setSelectedWeeklyGoalId] = useState<string | null>(null);

  // Zustand store
  const weeklyGoals = useWeeklyGoalsForGoal(goalId);
  const dailyTasks = useDailyTasksForWeeklyGoal(selectedWeeklyGoalId || '');
  const { addWeeklyGoal, updateWeeklyGoal, removeWeeklyGoal, addDailyTask, updateDailyTask, removeDailyTask } = useAppStore();

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
      const updated = await api.updateDailyTask(goalId, taskId, {
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
    await handleUpdateDailyTask(taskId, { completed });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Weekly Goals
          </h2>
          {goalTitle && (
            <p className="text-muted-foreground mt-1">For goal: {goalTitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={showWeeklyGoalDialog} onOpenChange={setShowWeeklyGoalDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Weekly Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="weekly-goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Weekly Goals ({weeklyGoals.length})
          </TabsTrigger>
          <TabsTrigger value="daily-tasks" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Daily Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <WeeklyGoalsOverview
            weeklyGoals={weeklyGoals}
            goalId={goalId}
            onWeeklyGoalClick={(weeklyGoalId: string) => {
              setSelectedWeeklyGoalId(weeklyGoalId);
              setActiveTab('daily-tasks');
            }}
          />
        </TabsContent>

        <TabsContent value="weekly-goals" className="space-y-4">
          {weeklyGoals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Weekly Goals Yet</h3>
              <p className="text-muted-foreground mb-4">
                Break down your goal into manageable weekly milestones.
              </p>
              <Button onClick={() => setShowWeeklyGoalDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Weekly Goal
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {weeklyGoals.map((weeklyGoal) => (
                <WeeklyGoalCard
                  key={weeklyGoal.id}
                  weeklyGoal={weeklyGoal}
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
        </TabsContent>

        <TabsContent value="daily-tasks" className="space-y-4">
          {selectedWeeklyGoalId ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Tasks for Week {weeklyGoals.find(wg => wg.id === selectedWeeklyGoalId)?.weekNumber}
                </h3>

                <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingTask ? 'Edit Daily Task' : 'Create Daily Task'}
                      </DialogTitle>
                    </DialogHeader>
                    <DailyTaskForm
                      task={editingTask}
                      weeklyGoalId={selectedWeeklyGoalId}
                      onSubmit={editingTask
                        ? (data: {
                            title: string;
                            description?: string;
                            day: number;
                            date?: string;
                            priority?: 'low' | 'medium' | 'high';
                            estimatedHours?: number;
                          }) => handleUpdateDailyTask(editingTask.id!, data)
                        : (data: {
                            title: string;
                            description?: string;
                            day: number;
                            date?: string;
                            priority?: 'low' | 'medium' | 'high';
                            estimatedHours?: number;
                          }) => handleCreateDailyTask(selectedWeeklyGoalId, data)
                      }
                      onCancel={() => {
                        setShowTaskDialog(false);
                        setEditingTask(null);
                      }}
                      isLoading={isLoading}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {dailyTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Daily Tasks Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add specific daily tasks to achieve this weekly goal.
                  </p>
                  <Button onClick={() => setShowTaskDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Task
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {dailyTasks.map((task) => (
                    <DailyTaskCard
                      key={task.id}
                      task={task}
                      onToggle={handleTaskToggle}
                      onEdit={(task) => {
                        setEditingTask(task);
                        setShowTaskDialog(true);
                      }}
                      onDelete={handleDeleteDailyTask}
                      showWeekContext={true}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Weekly Goal</h3>
              <p className="text-muted-foreground">
                Choose a weekly goal from the overview to view its daily tasks.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
