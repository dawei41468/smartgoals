import React from 'react';
import type { InsertGoal } from '@/lib/schema';

interface GoalSummaryCardProps {
  goalData: InsertGoal;
  totalWeeks: number;
  estimatedHours: number;
}

export function GoalSummaryCard({ goalData, totalWeeks, estimatedHours }: GoalSummaryCardProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4" data-testid="text-goal-title">
        Goal: {goalData.title || goalData.specific.substring(0, 50)}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Timeline:</span>
          <span className="text-sm text-gray-900 dark:text-gray-100 ml-2" data-testid="text-timeline">
            {totalWeeks} weeks
          </span>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Effort:</span>
          <span className="text-sm text-gray-900 dark:text-gray-100 ml-2" data-testid="text-effort">
            {estimatedHours} hours total
          </span>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Deadline:</span>
          <span className="text-sm text-gray-900 dark:text-gray-100 ml-2" data-testid="text-deadline">
            {new Date(goalData.deadline).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
