import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskItem } from './TaskItem';

interface Task {
  title: string;
  description?: string;
  priority: string;
  estimatedHours: number;
  day: number;
}

interface WeeklyGoal {
  weekNumber: number;
  title: string;
  description: string;
  tasks: Task[];
}

interface WeeklyBreakdownSectionProps {
  weeklyGoals: WeeklyGoal[];
  expandedWeeks: Set<number>;
  onToggleWeek: (weekNumber: number) => void;
  onMoveTask: (weekNumber: number, taskIndex: number, direction: 'up' | 'down') => void;
  getWeekBorderColor: (weekNumber: number) => string;
  getPriorityColor: (priority: string) => string;
  getDayName: (day: number) => string;
}

export function WeeklyBreakdownSection({ 
  weeklyGoals, 
  expandedWeeks, 
  onToggleWeek, 
  onMoveTask, 
  getWeekBorderColor, 
  getPriorityColor, 
  getDayName 
}: WeeklyBreakdownSectionProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Weekly Breakdown</h3>
      
      {weeklyGoals.map((week) => (
        <div key={week.weekNumber} className="border border-gray-200 dark:border-gray-700 rounded-lg" data-testid={`week-${week.weekNumber}`}>
          <div className="bg-gray-50 dark:bg-gray-800 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start sm:items-center justify-between">
              <div className="flex-1 min-w-0 pr-3">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words" data-testid={`text-week-title-${week.weekNumber}`}>
                  Week {week.weekNumber}: {week.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 break-words" data-testid={`text-week-description-${week.weekNumber}`}>
                  {week.description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleWeek(week.weekNumber)}
                data-testid={`button-toggle-week-${week.weekNumber}`}
                className="flex-shrink-0"
              >
                {expandedWeeks.has(week.weekNumber) ? 
                  <ChevronUp className="h-4 w-4" /> : 
                  <ChevronDown className="h-4 w-4" />
                }
              </Button>
            </div>
          </div>
          
          {expandedWeeks.has(week.weekNumber) && (
            <div className="p-4 sm:p-6">
              <div className={`border-l-4 ${getWeekBorderColor(week.weekNumber)} pl-4`}>
                <div className="space-y-4">
                  {week.tasks.map((task, taskIndex) => (
                    <TaskItem
                      key={taskIndex}
                      task={task}
                      taskIndex={taskIndex}
                      weekNumber={week.weekNumber}
                      isFirst={taskIndex === 0}
                      isLast={taskIndex === week.tasks.length - 1}
                      onMoveUp={() => onMoveTask(week.weekNumber, taskIndex, 'up')}
                      onMoveDown={() => onMoveTask(week.weekNumber, taskIndex, 'down')}
                      getPriorityColor={getPriorityColor}
                      getDayName={getDayName}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
