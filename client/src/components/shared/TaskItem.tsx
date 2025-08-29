import React, { memo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { getPriorityColor, getPriorityDisplayText } from '@/lib/goalUtils';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: string;
  estimatedHours?: number;
}

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string, completed: boolean) => Promise<void>;
  showEstimatedHours?: boolean;
  testIdPrefix?: string;
}

export const TaskItem = memo(function TaskItem({
  task,
  onToggle,
  showEstimatedHours = true,
  testIdPrefix = "task"
}: TaskItemProps) {
  // Local state for optimistic updates
  const [optimisticCompleted, setOptimisticCompleted] = useState(task.completed);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync with prop changes (when server state updates)
  React.useEffect(() => {
    setOptimisticCompleted(task.completed);
  }, [task.completed]);

  const handleToggle = async (checked: boolean) => {
    // Capture scroll position
    const scrollY = window.scrollY;

    // Optimistic update - immediately update local state
    setOptimisticCompleted(checked);
    setIsUpdating(true);

    try {
      // Make API call in background
      await onToggle(task.id, checked);

      // Success - optimistic update was correct
      setIsUpdating(false);
    } catch (error) {
      // Error - rollback optimistic update
      setOptimisticCompleted(!checked);
      setIsUpdating(false);

      // Could show error toast here if needed
      console.error('Failed to update task:', error);
    }

    // Restore scroll position
    const restoreScroll = () => {
      window.scrollTo({ top: scrollY, behavior: 'instant' });
    };

    setTimeout(restoreScroll, 0);
    requestAnimationFrame(restoreScroll);
  };

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg" style={{ minHeight: 'auto' }}>
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
      >
        <Checkbox
          checked={optimisticCompleted}
          onCheckedChange={handleToggle}
          disabled={isUpdating}
          data-testid={`${testIdPrefix}-${task.id}`}
        />
      </div>
      <div className="flex-1">
        <div className={`font-medium transition-colors duration-200 ${
          optimisticCompleted ? 'line-through text-gray-500' : ''
        } ${isUpdating ? 'opacity-70' : ''}`}>
          {task.title}
        </div>
        {task.description && (
          <div className={`text-sm transition-colors duration-200 ${
            optimisticCompleted ? 'line-through text-gray-400' : 'text-gray-600'
          } ${isUpdating ? 'opacity-70' : ''}`}>
            {task.description}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Badge className={getPriorityColor(task.priority)}>
          {getPriorityDisplayText(task.priority)}
        </Badge>
        {showEstimatedHours && (
          <div className="text-xs text-gray-500">
            {task.estimatedHours || 1}h
          </div>
        )}
      </div>
    </div>
  );
});
