import React, { useMemo, useState, memo, useCallback } from 'react';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { WeeklyGoalsOverview } from '@/components/weekly-goals/WeeklyGoalsOverview';
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/dateUtils';
import { getStatusColor, getStatusDisplayText } from '@/lib/goalUtils';
import { TaskItem } from '@/components/shared/TaskItem';
import { useDailyTasks, useAppStore } from '@/stores/appStore';
import type { GoalWithBreakdown } from '@/lib/schema';

interface GoalDetailsModalProps {
  goal: GoalWithBreakdown;
  onTaskToggle: (taskId: string, completed: boolean) => Promise<void>;
  activeTab?: string;
  onTabChange?: (tabValue: string) => void;
}

export const GoalDetailsModal = memo(function GoalDetailsModal({
  goal,
  onTaskToggle,
  activeTab = "smart",
  onTabChange
}: GoalDetailsModalProps) {
  const { t } = useLanguage();

  // Base toggle delegates to parent (handles API + additional store sync)
  const baseToggle = useCallback(async (taskId: string, completed: boolean) => {
    await onTaskToggle(taskId, completed);
  }, [onTaskToggle]);

  // Subscribe to store daily tasks and memoize filtering by goal to keep snapshot stable
  const allDailyTasks = useDailyTasks();
  const goalDailyTasks = useMemo(() => {
    return allDailyTasks.filter(t => t.goalId === goal.id);
  }, [allDailyTasks, goal.id]);

  // Build progress overlay using modal's weeklyGoal.tasks as base plus store tasks overrides
  const progressByWeeklyGoal = useMemo(() => {
    const map: Record<string, number> = {};
    const storeTasksById = new Map(allDailyTasks.map(t => [t.id, t.completed] as const));
    for (const wg of goal.weeklyGoals || []) {
      const tasks = wg.tasks || [];
      const total = tasks.length;
      if (total === 0) continue;
      let done = 0;
      for (const t of tasks) {
        const latestCompleted = storeTasksById.has(t.id) ? storeTasksById.get(t.id)! : t.completed;
        if (latestCompleted) done += 1;
      }
      map[wg.id] = (done / total) * 100;
    }
    return map;
  }, [allDailyTasks, goal.weeklyGoals]);

  // Per-weekly-goal toggle that also optimistically updates weekly/goal progress from modal data
  const makeWeeklyToggle = useCallback((weeklyGoalId: string) => {
    return async (taskId: string, completed: boolean) => {
      const store = useAppStore.getState();
      const prevTask = store.dailyTasks.find(t => t.id === taskId);
      const prevWeekly = (goal.weeklyGoals || []).find(w => w.id === weeklyGoalId);

      // Optimistically update the task in store (overlay for progress calc)
      store.updateDailyTask(taskId, { completed });

      // Recompute weekly progress using overlay of modal tasks + store
      if (prevWeekly) {
        const storeTasksById = new Map(store.dailyTasks.map(t => [t.id, t.completed] as const));
        let done = 0;
        const tasks = prevWeekly.tasks || [];
        for (const t of tasks) {
          const latest = t.id === taskId ? completed : (storeTasksById.has(t.id) ? storeTasksById.get(t.id)! : t.completed);
          if (latest) done += 1;
        }
        const total = tasks.length;
        const newWgProgress = total > 0 ? (done / total) * 100 : 0;
        store.updateWeeklyGoal(weeklyGoalId, { progress: newWgProgress });

        // Update parent goal progress as average of its weekly goals from store
        const wgs = store.weeklyGoals.filter(w => w.goalId === goal.id);
        const avg = wgs.length ? (wgs.reduce((acc, w) => acc + (w.progress || 0), 0) / wgs.length) : 0;
        store.updateGoal(goal.id, { progress: Math.round(avg * 100) / 100 });
      }

      try {
        await baseToggle(taskId, completed);
      } catch (e) {
        // Rollback task if we had it in store
        if (prevTask) store.updateDailyTask(taskId, { completed: prevTask.completed });
        // Note: weekly/goal progress will be corrected by parent retry or next refresh
        throw e;
      }
    };
  }, [baseToggle, goal.id, goal.weeklyGoals]);

  const weeklyGoalsWithTasks = useMemo(() => 
    goal.weeklyGoals?.filter(wg => wg.tasks?.length) || [],
    [goal.weeklyGoals]
  );

  const hasWeeklyGoals = useMemo(() => 
    goal.weeklyGoals?.length > 0,
    [goal.weeklyGoals]
  );

  const hasAnyTasks = useMemo(() => 
    goal.weeklyGoals?.some(wg => wg.tasks?.length) || false,
    [goal.weeklyGoals]
  );

  return (
    <CardContent className="border-t pt-6 px-4">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-11">
          <TabsTrigger value="smart" className="text-sm">SMART(ER)</TabsTrigger>
          <TabsTrigger value="milestones" className="text-sm">Milestones</TabsTrigger>
          <TabsTrigger value="tasks" className="text-sm">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="smart" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-base text-gray-700">Specific</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{goal.specific}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-base text-gray-700">Measurable</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{goal.measurable}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-base text-gray-700">Achievable</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{goal.achievable}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-base text-gray-700">Relevant</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{goal.relevant}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-base text-gray-700">Time-bound</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{goal.timebound}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-base text-gray-700">Exciting</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{goal.exciting}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4 mt-6">
          {/* Weekly overview + CTA at top */}
          <div className="space-y-4">
            <WeeklyGoalsOverview 
              weeklyGoals={goal.weeklyGoals || []} 
              goalId={goal.id}
              progressByWeeklyGoal={progressByWeeklyGoal}
            />
          </div>

          {hasWeeklyGoals ? (
            <div className="space-y-3">
              {goal.weeklyGoals.map((weeklyGoal) => {
                const progress = typeof progressByWeeklyGoal[weeklyGoal.id!] === 'number'
                  ? progressByWeeklyGoal[weeklyGoal.id!]
                  : (weeklyGoal.progress || 0);
                const derivedStatus = progress >= 100 ? 'completed' : progress > 0 ? 'active' : (weeklyGoal.status || 'pending');
                return (
                <div key={weeklyGoal.id} className="border rounded-lg p-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm leading-tight flex-1">{weeklyGoal.title}</h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={`${getStatusColor(derivedStatus)} text-xs px-2 py-1`}>
                          {getStatusDisplayText(derivedStatus)}
                        </Badge>
                        <div className="text-xs text-gray-600 font-medium">
                          {Number.isFinite(progress) ? progress.toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                    {weeklyGoal.description && (
                      <p className="text-xs text-gray-600 leading-relaxed">{weeklyGoal.description}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      Week {weeklyGoal.weekNumber}: {formatDate(weeklyGoal.startDate)} - {formatDate(weeklyGoal.endDate)}
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-6 text-sm">No milestones available</p>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4 mt-6">
          {/* Weekly Planner entry point at top */}
          <div>
            <Link href={`/weekly-goals/${goal.id}`}>
              <Button className="w-full">Open Weekly Planner</Button>
            </Link>
          </div>
          {hasAnyTasks ? (
            <div className="space-y-5">
              {weeklyGoalsWithTasks.map((weeklyGoal) => (
                weeklyGoal.tasks?.length ? (
                  <div key={weeklyGoal.id}>
                    <h4 className="font-semibold text-base mb-4 text-gray-700">{weeklyGoal.title}</h4>
                    <div className="space-y-3">
                      {weeklyGoal.tasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onToggle={makeWeeklyToggle(weeklyGoal.id)}
                        />
                      ))}
                    </div>
                  </div>
                ) : null
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8 text-sm">No tasks available</p>
          )}
        </TabsContent>
      </Tabs>
    </CardContent>
  );
});
