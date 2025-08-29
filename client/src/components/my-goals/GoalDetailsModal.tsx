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
    <CardContent className="border-t pt-6">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="smart">SMART(ER)</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="smart" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-1">Specific</h4>
              <p className="text-sm text-gray-600">{goal.specific}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-1">Measurable</h4>
              <p className="text-sm text-gray-600">{goal.measurable}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-1">Achievable</h4>
              <p className="text-sm text-gray-600">{goal.achievable}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-1">Relevant</h4>
              <p className="text-sm text-gray-600">{goal.relevant}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-1">Time-bound</h4>
              <p className="text-sm text-gray-600">{goal.timebound}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-1">Exciting</h4>
              <p className="text-sm text-gray-600">{goal.exciting}</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="milestones" className="space-y-4">
          {hasWeeklyGoals ? (
            <div className="space-y-3">
              {goal.weeklyGoals.map((weeklyGoal) => (
                <div key={weeklyGoal.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{weeklyGoal.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(weeklyGoal.status)}>
                        {getStatusDisplayText(weeklyGoal.status)}
                      </Badge>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {weeklyGoal.progress || 0}%
                      </div>
                    </div>
                  </div>
                  {weeklyGoal.description && (
                    <p className="text-sm text-gray-600 mb-2">{weeklyGoal.description}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    Week {weeklyGoal.weekNumber}: {formatDate(weeklyGoal.startDate)} - {formatDate(weeklyGoal.endDate)}
                  </div>
                  <Progress value={weeklyGoal.progress || 0} className="mt-2" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No milestones available</p>
          )}
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-4">
          {hasAnyTasks ? (
            <div className="space-y-4">
              {weeklyGoalsWithTasks.map((weeklyGoal) => (
                weeklyGoal.tasks?.length ? (
                  <div key={weeklyGoal.id}>
                    <h4 className="font-semibold mb-3">{weeklyGoal.title}</h4>
                    <div className="space-y-2">
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
            <p className="text-center text-gray-500 py-8">No tasks available</p>
          )}
        </TabsContent>
      </Tabs>
    </CardContent>
  );
});
