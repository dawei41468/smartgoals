import React, { useMemo, useState, memo, useCallback } from 'react';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/dateUtils';
import { getStatusColor, getStatusDisplayText } from '@/lib/goalUtils';
import { TaskItem } from '@/components/shared/TaskItem';
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

  // Memoize the task toggle handler to prevent unnecessary re-renders
  const handleTaskToggle = useCallback(async (taskId: string, completed: boolean) => {
    await onTaskToggle(taskId, completed);
  }, [onTaskToggle]);

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
          {hasWeeklyGoals ? (
            <div className="space-y-3">
              {goal.weeklyGoals.map((weeklyGoal) => (
                <div key={weeklyGoal.id} className="border rounded-lg p-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm leading-tight flex-1">{weeklyGoal.title}</h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={`${getStatusColor(weeklyGoal.status)} text-xs px-2 py-1`}>
                          {getStatusDisplayText(weeklyGoal.status)}
                        </Badge>
                        <div className="text-xs text-gray-600 font-medium">
                          {weeklyGoal.progress || 0}%
                        </div>
                      </div>
                    </div>
                    {weeklyGoal.description && (
                      <p className="text-xs text-gray-600 leading-relaxed">{weeklyGoal.description}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      Week {weeklyGoal.weekNumber}: {formatDate(weeklyGoal.startDate)} - {formatDate(weeklyGoal.endDate)}
                    </div>
                    <Progress value={weeklyGoal.progress || 0} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-6 text-sm">No milestones available</p>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4 mt-6">
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
                          onToggle={handleTaskToggle}
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
