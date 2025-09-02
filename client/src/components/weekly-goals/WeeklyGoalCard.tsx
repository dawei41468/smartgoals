import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, Clock, Edit, Trash2, Plus } from 'lucide-react';
import { WeeklyGoalResponse, DailyTaskResponse } from '@/lib/types';
import { getStatusColor } from '@/lib/goalUtils';
import { formatDateRange } from '@/lib/dateUtils';

interface WeeklyGoalCardProps {
  weeklyGoal: WeeklyGoalResponse & { tasks?: DailyTaskResponse[] };
  onEdit?: (weeklyGoal: WeeklyGoalResponse) => void;
  onDelete?: (weeklyGoalId: string) => void;
  onAddTask?: (weeklyGoalId: string) => void;
  onTaskToggle?: (taskId: string, completed: boolean) => Promise<void>;
  isCompact?: boolean;
}

export const WeeklyGoalCard = memo(function WeeklyGoalCard({
  weeklyGoal,
  onEdit,
  onDelete,
  onAddTask,
  onTaskToggle,
  isCompact = false
}: WeeklyGoalCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const tasks = weeklyGoal.tasks || [];
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    if (!onTaskToggle) return;

    setIsUpdating(true);
    try {
      await onTaskToggle(taskId, completed);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isCompact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{weeklyGoal.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Week {weeklyGoal.weekNumber}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Badge
                variant="outline"
                className={`text-xs ${getStatusColor(weeklyGoal.status || 'pending')}`}
              >
                {weeklyGoal.status || 'pending'}
              </Badge>
              <div className="text-xs text-muted-foreground">
                {completedTasks}/{totalTasks}
              </div>
            </div>
          </div>

          {totalTasks > 0 && (
            <div className="mt-3">
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg flex items-center gap-2">
              Week {weeklyGoal.weekNumber}
              <Badge
                variant="outline"
                className={getStatusColor(weeklyGoal.status || 'pending')}
              >
                {weeklyGoal.status || 'pending'}
              </Badge>
            </CardTitle>
            <h3 className="font-medium mt-1">{weeklyGoal.title}</h3>
          </div>

          <div className="flex items-center gap-1 ml-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(weeklyGoal)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(weeklyGoal.id!)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {weeklyGoal.description && (
          <p className="text-sm text-muted-foreground mt-2">
            {weeklyGoal.description}
          </p>
        )}
      </CardHeader>

      <CardContent>
        {/* Date Range */}
        {weeklyGoal.startDate && weeklyGoal.endDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <CalendarDays className="h-4 w-4" />
            <span>{formatDateRange(weeklyGoal.startDate, weeklyGoal.endDate)}</span>
          </div>
        )}

        {/* Progress */}
        {totalTasks > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{completedTasks}/{totalTasks} tasks</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Tasks Preview */}
        {tasks.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Daily Tasks ({tasks.length})
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {tasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={task.completed || false}
                    onChange={(e) => handleTaskToggle(task.id!, e.target.checked)}
                    disabled={isUpdating}
                    className="rounded"
                  />
                  <span className={`flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                    Day {task.day}: {task.title}
                  </span>
                  {task.estimatedHours && (
                    <Badge variant="secondary" className="text-xs">
                      {task.estimatedHours}h
                    </Badge>
                  )}
                </div>
              ))}
              {tasks.length > 3 && (
                <div className="text-xs text-muted-foreground text-center py-1">
                  +{tasks.length - 3} more tasks
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          {onAddTask && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddTask(weeklyGoal.id!)}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
