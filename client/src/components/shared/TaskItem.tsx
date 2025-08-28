import React from 'react';
import { Badge } from '@/components/ui/badge';
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
  onToggle: (taskId: string, completed: boolean) => void;
  showEstimatedHours?: boolean;
  testIdPrefix?: string;
}

export function TaskItem({ 
  task, 
  onToggle, 
  showEstimatedHours = true,
  testIdPrefix = "task"
}: TaskItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <input
        type="checkbox"
        checked={task.completed || false}
        onChange={(e) => onToggle(task.id, e.target.checked)}
        className="rounded"
        data-testid={`${testIdPrefix}-${task.id}`}
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
        {showEstimatedHours && (
          <div className="text-xs text-gray-500">
            {task.estimatedHours || 1}h
          </div>
        )}
      </div>
    </div>
  );
}
