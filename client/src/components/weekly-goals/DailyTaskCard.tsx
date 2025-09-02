import React, { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { DailyTaskResponse } from '@/lib/types';
import { getPriorityColor, getPriorityDisplayText } from '@/lib/goalUtils';

interface DailyTaskCardProps {
  task: DailyTaskResponse;
  onToggle: (taskId: string, completed: boolean) => Promise<void>;
  onEdit?: (task: DailyTaskResponse) => void;
  onDelete?: (taskId: string) => void;
  showWeekContext?: boolean;
  isCompact?: boolean;
}

export const DailyTaskCard = memo(function DailyTaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
  showWeekContext = false,
  isCompact = false
}: DailyTaskCardProps) {
  const [optimisticCompleted, setOptimisticCompleted] = useState(task.completed || false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync with prop changes
  React.useEffect(() => {
    setOptimisticCompleted(task.completed || false);
  }, [task.completed]);

  const handleToggle = async (checked: boolean) => {
    // Optimistic update
    setOptimisticCompleted(checked);
    setIsUpdating(true);

    try {
      await onToggle(task.id!, checked);
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticCompleted(!checked);
    } finally {
      setIsUpdating(false);
    }
  };

  const priorityColor = getPriorityColor(task.priority || 'medium');
  const priorityText = getPriorityDisplayText(task.priority || 'medium');

  if (isCompact) {
    return (
      <Card className={`hover:shadow-sm transition-all ${optimisticCompleted ? 'opacity-60' : ''}`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={optimisticCompleted}
              onCheckedChange={handleToggle}
              disabled={isUpdating}
              className="mt-0.5"
            />

            <div className="flex-1 min-w-0">
              <h4 className={`font-medium text-sm ${optimisticCompleted ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </h4>

              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs ${priorityColor}`}>
                  {priorityText}
                </Badge>

                {task.estimatedHours && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{task.estimatedHours}h</span>
                  </div>
                )}

                {showWeekContext && task.day && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Day {task.day}</span>
                  </div>
                )}
              </div>
            </div>

            {(onEdit || onDelete) && (
              <div className="flex items-center gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(task)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(task.id!)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${optimisticCompleted ? 'bg-muted/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Checkbox
            checked={optimisticCompleted}
            onCheckedChange={handleToggle}
            disabled={isUpdating}
            className="mt-1"
          />

          <div className="flex-1 min-w-0">
            <h3 className={`font-medium ${optimisticCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </h3>

            {task.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-3 mt-3">
              <Badge variant="outline" className={priorityColor}>
                {priorityText}
              </Badge>

              {task.estimatedHours && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{task.estimatedHours} hours</span>
                </div>
              )}

              {task.day && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Day {task.day}</span>
                </div>
              )}

              {task.date && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(task.date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Task Actions */}
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(task)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(task.id!)}
                className="flex-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
