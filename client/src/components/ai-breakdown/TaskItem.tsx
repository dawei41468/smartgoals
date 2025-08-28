import React from 'react';
import { ChevronUp, ChevronDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface Task {
  title: string;
  description?: string;
  priority: string;
  estimatedHours: number;
  day: number;
}

interface TaskItemProps {
  task: Task;
  taskIndex: number;
  weekNumber: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  getPriorityColor: (priority: string) => string;
  getDayName: (day: number) => string;
}

export function TaskItem({ 
  task, 
  taskIndex, 
  weekNumber, 
  isFirst, 
  isLast, 
  onMoveUp, 
  onMoveDown, 
  getPriorityColor, 
  getDayName 
}: TaskItemProps) {
  return (
    <div className="flex items-start space-x-3" data-testid={`task-${weekNumber}-${taskIndex}`}>
      <Checkbox className="mt-1 flex-shrink-0" data-testid={`checkbox-task-${weekNumber}-${taskIndex}`} />
      <div className="flex-1 min-w-0">
        <div className="mb-1">
          <span className="text-sm font-medium text-gray-900 dark:text-white block mb-2" data-testid={`text-task-title-${weekNumber}-${taskIndex}`}>
            {task.title}
          </span>
          <div className="flex flex-wrap gap-2">
            <span className={`px-2 py-1 text-xs rounded flex-shrink-0 ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded flex items-center flex-shrink-0">
              <Clock className="h-3 w-3 mr-1" />
              {task.estimatedHours}h
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded flex-shrink-0">
              {getDayName(task.day)}
            </span>
          </div>
        </div>
        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 break-words" data-testid={`text-task-description-${weekNumber}-${taskIndex}`}>
            {task.description}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMoveUp}
          disabled={isFirst}
          className="h-6 w-6 p-0"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onMoveDown}
          disabled={isLast}
          className="h-6 w-6 p-0"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
