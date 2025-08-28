import React from 'react';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/dateUtils';
import { getStatusColor, getPriorityColor, getStatusDisplayText, getPriorityDisplayText } from '@/lib/goalUtils';
import type { GoalWithBreakdown } from '@/lib/schema';

interface GoalDetailsModalProps {
  goal: GoalWithBreakdown;
  onTaskToggle: (taskId: string, completed: boolean) => void;
}

export function GoalDetailsModal({ goal, onTaskToggle }: GoalDetailsModalProps) {
  return (
    <CardContent className="border-t pt-6">
      <Tabs defaultValue="smart" className="w-full">
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
          {goal.weeklyGoals?.length ? (
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
          {goal.weeklyGoals?.some(wg => wg.tasks?.length) ? (
            <div className="space-y-4">
              {goal.weeklyGoals.map((weeklyGoal) => (
                weeklyGoal.tasks?.length ? (
                  <div key={weeklyGoal.id}>
                    <h4 className="font-semibold mb-3">{weeklyGoal.title}</h4>
                    <div className="space-y-2">
                      {weeklyGoal.tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <input
                            type="checkbox"
                            checked={task.completed || false}
                            onChange={(e) => onTaskToggle(task.id, e.target.checked)}
                            className="rounded"
                            data-testid={`task-checkbox-${task.id}`}
                          />
                          <div className="flex-1">
                            <div className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                              {task.title}
                            </div>
                            {task.description && (
                              <div className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                                {task.description}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(task.priority)}>
                              {getPriorityDisplayText(task.priority)}
                            </Badge>
                            <div className="text-xs text-gray-500">
                              {task.estimatedHours || 1}h
                            </div>
                          </div>
                        </div>
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
}
